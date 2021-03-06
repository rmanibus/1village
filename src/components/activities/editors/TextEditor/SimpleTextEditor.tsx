import classnames from 'classnames';
import { Editor, RichUtils, DraftHandleValue, ContentState, convertToRaw, EditorState, Modifier, DraftEditorCommand, ContentBlock } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import {
  setBlockData,
  getSelectedBlock,
  getSelectionInlineStyle,
  extractInlineStyle,
  getCustomStyleMap,
  getSelectionCustomInlineStyle,
  toggleCustomInlineStyle,
} from 'draftjs-utils';
import htmlToDraft from 'html-to-draftjs';
import React from 'react';

import Paper from '@material-ui/core/Paper';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { Divider } from '@material-ui/core';

import { fontDetailColor, primaryColor } from 'src/styles/variables.const';

import { ColorPicker } from './toolbar/ColorPicker';
import { EmojiPicker } from './toolbar/EmojiPicker';
import { InlineButtons } from './toolbar/InlineButtons';
import { TextAlignButtons } from './toolbar/TextAlignButtons';
import { TitleChoice } from './toolbar/TitleChoice';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    paper: {
      display: 'flex',
      border: `1px solid ${theme.palette.divider}`,
      flexWrap: 'wrap',
    },
    divider: {
      margin: theme.spacing(1, 0.5),
    },
  }),
);

function blockStyleFn(block: ContentBlock): string {
  const blockAlignment = block.getData() && block.getData().get('text-align');
  if (blockAlignment) {
    return `${blockAlignment}-aligned-block`;
  }
  return '';
}

interface SimpleTextEditorProps {
  value: string;
  onChange?(newValue: string): void;
  placeholder?: string;
  inlineToolbar?: boolean;
  withBorder?: boolean;
  noBlock?: boolean;
}

export const SimpleTextEditor: React.FC<SimpleTextEditorProps> = ({
  value = '',
  placeholder = 'Commencez à écrire ici, ou ajoutez une vidéo ou une image.',
  onChange = () => {},
  inlineToolbar = false,
  withBorder = false,
  noBlock = false,
}: SimpleTextEditorProps) => {
  const [editorState, setEditorState] = React.useState<EditorState>(EditorState.createEmpty());
  const editorContainerRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<Editor>(null);
  const classes = useStyles();

  const previousValue = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (value !== previousValue.current) {
      previousValue.current = value;
      const { contentBlocks, entityMap } = htmlToDraft(value);
      const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
      const newEditorState = EditorState.createWithContent(contentState);
      extractInlineStyle(newEditorState);
      setEditorState(newEditorState);
    }
  }, [value]);

  const onEditorChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    const newHTMLValue = draftToHtml(convertToRaw(newEditorState.getCurrentContent()));
    previousValue.current = newHTMLValue;
    onChange(newHTMLValue);
  };

  const handleKeyCommand = (command: DraftEditorCommand, editorState: EditorState): DraftHandleValue => {
    const newEditorState = RichUtils.handleKeyCommand(editorState, command);
    if (newEditorState) {
      onEditorChange(newEditorState);
      return 'handled';
    }
    return 'not-handled';
  };

  // --- Current values ---
  const { currentInlineStyle, currentAlignment, currentHeader, currentColor } = React.useMemo(() => {
    const currentBlock: ContentBlock = getSelectedBlock(editorState);
    return {
      currentInlineStyle: getSelectionInlineStyle(editorState),
      currentAlignment: currentBlock.getData().get('text-align') || 'left',
      currentHeader: currentBlock.getType(),
      currentColor: (getSelectionCustomInlineStyle(editorState, ['COLOR']).COLOR || '-').split('-')[1] || '',
    };
  }, [editorState]);

  // ----- Inline style -----
  const setInlineStyle = (inlineStyle: 'BOLD' | 'ITALIC' | 'UNDERLINE', value: boolean) => {
    if (currentInlineStyle[inlineStyle] !== value) {
      onEditorChange(RichUtils.toggleInlineStyle(editorState, inlineStyle));
    }
  };

  // --- Color style ---
  const setInlineColor = (value: string) => {
    // default text color
    if (value === 'rgb(46, 52, 59)') {
      if (currentColor) {
        onEditorChange(toggleCustomInlineStyle(editorState, 'color', currentColor));
      }
    } else {
      if (currentColor !== value) {
        onEditorChange(toggleCustomInlineStyle(editorState, 'color', value));
      }
    }
  };

  // --- Block style ---
  const toggleBlockType = (blockType: string) => {
    onEditorChange(RichUtils.toggleBlockType(editorState, blockType));
  };

  // --- Text Align ---
  const setBlockAlignmentData = (value: 'left' | 'center' | 'right') => {
    onEditorChange(setBlockData(editorState, { 'text-align': value === 'left' ? undefined : value }));
  };

  // --- Emoji ---
  const addEmoji = (emoji: string) => {
    const contentState = Modifier.replaceText(
      editorState.getCurrentContent(),
      editorState.getSelection(),
      emoji,
      editorState.getCurrentInlineStyle(),
    );
    onEditorChange(EditorState.push(editorState, contentState, 'insert-characters'));
  };

  const hasFocus = React.useMemo(() => {
    const selection = editorState.getSelection();
    return selection.getHasFocus();
  }, [editorState]);

  const displayPlaceholder = React.useMemo(() => {
    return !value || value.length === 0 || value === '<p></p>' || value === '<p></p>\n';
  }, [value]);

  const toolbar = (
    <Paper
      elevation={0}
      className={classes.paper}
      style={
        withBorder
          ? {
              margin: '-1px',
              borderColor: primaryColor,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }
          : {}
      }
    >
      <InlineButtons value={currentInlineStyle} onChange={setInlineStyle} />
      {noBlock || (
        <>
          <Divider flexItem orientation="vertical" className={classes.divider} />
          <TextAlignButtons value={currentAlignment} onChange={setBlockAlignmentData} />
          <Divider flexItem orientation="vertical" className={classes.divider} />
          <TitleChoice value={currentHeader as 'unstyle' | 'header-one' | 'header-two'} onChange={toggleBlockType} />
        </>
      )}
      <Divider flexItem orientation="vertical" className={classes.divider} />
      <ColorPicker value={currentColor} onChange={setInlineColor} />
      <EmojiPicker onChange={addEmoji} />
    </Paper>
  );

  return (
    <div
      ref={editorContainerRef}
      className={classnames('text-editor', { 'text-editor--with-border': withBorder })}
      onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => {
        if (editorRef.current) {
          event.preventDefault();
          editorRef.current.focus();
        }
      }}
    >
      {inlineToolbar ? (
        <div style={{ marginBottom: '0.5rem' }}>{toolbar}</div>
      ) : (
        <div className="text-editor__toolbar-container">
          <div
            className={classnames('text-editor__toolbar', {
              'text-editor__toolbar--visible': hasFocus,
            })}
          >
            {toolbar}
          </div>
        </div>
      )}
      <div style={{ position: 'relative', margin: withBorder ? '0.25rem' : 0, minHeight: withBorder ? '3rem' : 'unset' }}>
        {displayPlaceholder && <div style={{ position: 'absolute', color: fontDetailColor }}>{placeholder}</div>}
        <div
          onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => {
            event.stopPropagation();
          }}
        >
          <Editor
            customStyleMap={getCustomStyleMap()}
            ref={editorRef}
            editorState={editorState}
            onChange={onEditorChange}
            handleKeyCommand={handleKeyCommand}
            blockStyleFn={blockStyleFn}
          />
        </div>
      </div>
    </div>
  );
};
