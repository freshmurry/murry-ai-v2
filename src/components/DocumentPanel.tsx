interface Props {
    projectId: string;
  }
  
  export default function DocumentsPanel({
    projectId,
  }: Props) {
    return (
      <div className="p-4">
        Documents for:
        {projectId}
      </div>
    );
  }