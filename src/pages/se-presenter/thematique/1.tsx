import { useRouter } from 'next/router';
import React from 'react';

import { PRESENTATION_THEMATIQUE } from 'src/activities/presentation.const';
import { Base } from 'src/components/Base';
import { Steps } from 'src/components/Steps';
import { BackButton } from 'src/components/buttons/BackButton';
import { ThemeChoiceButton } from 'src/components/buttons/ThemeChoiceButton';
import { ActivityContext } from 'src/contexts/activityContext';
import { ActivityType } from 'types/activity.type';

const PresentationStep1: React.FC = () => {
  const router = useRouter();
  const { createNewActivity } = React.useContext(ActivityContext);

  const onClick = (index: number) => () => {
    const success = createNewActivity(ActivityType.PRESENTATION, {
      theme: index,
    });
    if (success) {
      router.push('/se-presenter/thematique/2');
    }
  };

  return (
    <Base>
      <div style={{ width: '100%', padding: '0.5rem 1rem 1rem 1rem' }}>
        <BackButton href="/se-presenter" />
        <Steps steps={['Choix du thème', 'Présentation', 'Prévisualisation']} activeStep={0} />
        <div style={{ margin: '0 auto 1rem auto', width: '100%', maxWidth: '900px' }}>
          <h1>Choisissez le thème de votre présentation</h1>
          <p className="text" style={{ fontSize: '1.1rem' }}>
            Dans cette activité, nous vous proposons de faire une présentation générale aux Pélicopains sur le thème de votre choix.
          </p>
          <div>
            {PRESENTATION_THEMATIQUE.map((t, index) => (
              <ThemeChoiceButton key={index} label={t.label} description={t.description} onClick={onClick(index)} />
            ))}
          </div>
        </div>
      </div>
    </Base>
  );
};

export default PresentationStep1;
