type EmptyStateProps = {
  titulo: string;
  descripcion?: string;
};

export default function EmptyState({ titulo, descripcion }: EmptyStateProps) {
  return (
    <div className="ds-panel p-6 text-center">
      <h3 className="text-lg font-semibold ds-text">{titulo}</h3>
      {descripcion ? <p className="mt-2 text-sm ds-muted">{descripcion}</p> : null}
    </div>
  );
}
