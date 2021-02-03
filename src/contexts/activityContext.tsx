import { useRouter } from "next/router";
import { useQueryCache } from "react-query";
import React from "react";

import type { EditorTypes, EditorContent } from "src/components/activityEditor/editing.types";
import { AxiosReturnType } from "src/utils/axiosRequest";
import { getQueryString } from "src/utils";
import { Activity, ActivityType } from "types/activity.type";

import { UserContext } from "./userContext";
import { VillageContext } from "./villageContext";

export type ExtendedActivity = Activity & {
  data: { [key: string]: string | number | boolean };
  processedContent: Array<EditorContent>;
  dataId: number;
};

interface ActivityContextValue {
  activity: ExtendedActivity | null;
  updateActivity(newActivity: Partial<ExtendedActivity>): void;
  createNewActivity(type: ActivityType, initialData?: { [key: string]: string | number | boolean }): boolean;
  addContent(type: EditorTypes, value?: string): void;
  deleteContent(index: number): void;
  save(): Promise<boolean>;
}

export const ActivityContext = React.createContext<ActivityContextValue>(null);

interface ActivityContextProviderProps {
  children: React.ReactNode;
}

export function getExtendedActivity(activity: Activity): ExtendedActivity {
  let data: { [key: string]: string | number | boolean } = {};
  let dataId = 0;
  const processedContent: Array<EditorContent> = [];
  activity.content.forEach((c) => {
    if (c.key === "h5p") {
      return; // not yet handled
    }
    if (c.key === "json") {
      const decodedValue = JSON.parse(c.value);
      if (decodedValue.type && decodedValue.type === "data") {
        data = decodedValue.data || {};
        dataId = c.id;
        // } else {
        // processedContent.push() // todo
      }
    } else {
      processedContent.push({
        type: c.key,
        id: c.id,
        value: c.value,
      });
    }
  });
  return {
    ...activity,
    data,
    dataId,
    processedContent,
  };
}

export const ActivityContextProvider: React.FC<ActivityContextProviderProps> = ({ children }: ActivityContextProviderProps) => {
  const router = useRouter();
  const queryCache = useQueryCache();
  const { user, axiosLoggedRequest } = React.useContext(UserContext);
  const { village } = React.useContext(VillageContext);
  const [activity, setActivity] = React.useState<ExtendedActivity | null>(null);

  const currentActivityId = activity === null ? null : activity.id;

  const getActivity = React.useCallback(
    async (id: number) => {
      const response = await axiosLoggedRequest({
        method: "GET",
        url: `/activities/${id}`,
      });
      if (response.error) {
        router.push("/");
      } else {
        setActivity(getExtendedActivity(response.data));
      }
    },
    [router, axiosLoggedRequest],
  );
  React.useEffect(() => {
    if ("activity-id" in router.query) {
      const newActivityId = parseInt(getQueryString(router.query["activity-id"]), 10);
      if (currentActivityId === null || currentActivityId !== newActivityId) {
        setActivity(null);
        getActivity(newActivityId).catch();
      }
    }
  }, [getActivity, router, currentActivityId]);

  const updateActivity = React.useCallback((newActivity: Partial<ExtendedActivity>) => {
    setActivity((a) => (a === null ? a : { ...a, ...newActivity }));
  }, []);

  const createNewActivity = React.useCallback(
    (type: ActivityType, initialData?: { [key: string]: string | number | boolean }) => {
      if (user === null || village === null) {
        return false;
      }
      const activity: ExtendedActivity = {
        id: 0,
        type: type,
        userId: user.id,
        villageId: village.id,
        content: [],
        responseActivityId: null,
        responseType: null,
        data: initialData || {},
        dataId: 0,
        processedContent: [{ type: "text", id: 0, value: "" }],
      };
      setActivity(activity);
      return true;
    },
    [user, village],
  );

  const activityContent = activity?.processedContent || null;

  const addContent = React.useCallback(
    (type: EditorTypes, value: string = "") => {
      if (activityContent === null) {
        return;
      }
      const newId = Math.max(1, activity.dataId || 0, ...activityContent.map((p) => p.id)) + 1;
      const newContent = activityContent;
      newContent.push({
        id: newId,
        type,
        value,
      });
      updateActivity({ processedContent: newContent });
    },
    [updateActivity, activity, activityContent],
  );

  const deleteContent = React.useCallback(
    (index: number) => {
      if (activityContent === null) {
        return;
      }
      const newContent = [...activityContent];
      newContent.splice(index, 1);
      updateActivity({ processedContent: newContent });
    },
    [updateActivity, activityContent],
  );

  const createActivity = React.useCallback(async () => {
    const content: Array<{ key: string; value: string }> = activity.processedContent
      .map((p) => {
        if (p.type === "text" || p.type === "image" || p.type === "video") {
          return {
            key: p.type,
            value: p.value,
          };
        }
        return null;
      })
      .filter((c) => c !== null);
    content.push({
      key: "json",
      value: JSON.stringify({
        type: "data",
        data: activity.data,
      }),
    });
    const data: Omit<Partial<Activity>, "content"> & { content: Array<{ key: string; value: string }> } = {
      type: activity.type,
      villageId: activity.villageId,
      content,
    };
    // if (activity.responseActivityId !== undefined) {
    //   data.responseActivityId = activity.responseActivityId;
    //   data.responseType = activity.responseType;
    // }
    const response = await axiosLoggedRequest({
      method: "POST",
      url: "/activities",
      data,
    });
    if (response.error) {
      return false;
    } else {
      setActivity(getExtendedActivity(response.data));
      return true;
    }
  }, [axiosLoggedRequest, activity]);

  const editActivity = React.useCallback(async () => {
    const mapIndex = activity.content.reduce<{ [key: number]: number }>((acc, c, i) => {
      acc[c.id] = i;
      return acc;
    }, {});
    const content: Array<{ key: string; value: string; id?: number }> = activity.processedContent
      .map((p) => {
        if (p.type === "text" || p.type === "image" || p.type === "video") {
          const d: { key: string; value: string; id?: number } = {
            key: p.type,
            value: p.value,
          };
          if (mapIndex[p.id] !== undefined && p.id !== activity.dataId) {
            d.id = p.id;
          }
          return d;
        }
        return null;
      })
      .filter((c) => c !== null);
    content.push({
      key: "json",
      value: JSON.stringify({
        type: "data",
        data: activity.data,
      }),
      id: activity.dataId,
    });

    const response = await axiosLoggedRequest({
      method: "PUT",
      url: `/activities/${activity.id}/content`,
      data: {
        content,
      },
    });
    if (response.error) {
      return false;
    }
    setActivity(getExtendedActivity(response.data));
    return true;
  }, [axiosLoggedRequest, activity]);

  const save = React.useCallback(async () => {
    if (activity === null) {
      return false;
    }
    queryCache.invalidateQueries("activities");
    if (activity.id === 0) {
      return await createActivity();
    } else {
      return await editActivity();
    }
  }, [queryCache, createActivity, editActivity, activity]);

  return (
    <ActivityContext.Provider
      value={{
        activity,
        updateActivity,
        createNewActivity,
        addContent,
        deleteContent,
        save,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
};