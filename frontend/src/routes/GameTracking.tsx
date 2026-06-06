import { useParams } from 'react-router';

export function GameTracking() {
  const { game } = useParams<{ game: string }>();
  return (
    <section className="p-4">
      <h1 className="text-xl font-semibold">Game tracking: {game}</h1>
    </section>
  );
}
