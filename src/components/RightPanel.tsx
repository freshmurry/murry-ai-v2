import ChatPanel from './ChatPanel';
import DocumentsPanel from './DocumentsPanel';

interface Props {
  activeProject?: {
    id: string;
  };

  rightTab: string;
}

export default function RightPanel({
  activeProject,
  rightTab,
}: Props) {
  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-full">
        Select a project
      </div>
    );
  }

  switch (rightTab) {
    case 'documents':
      return (
        <DocumentsPanel
          projectId={activeProject.id}
        />
      );

    case 'chat':
      return (
        <ChatPanel
          projectId={activeProject.id}
        />
      );

    default:
      return (
        <div>
          Unknown panel
        </div>
      );
  }
}