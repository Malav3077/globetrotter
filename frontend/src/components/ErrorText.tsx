export default function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600" role="alert">
      {message}
    </p>
  );
}
