import { ButtonLink, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <main id="main" className="grid flex-1 place-items-center px-4">
      <EmptyState
        title="Page not found"
        description="The page you’re looking for doesn’t exist or you don’t have access to it."
        action={<ButtonLink href="/">Back to home</ButtonLink>}
      />
    </main>
  );
}
