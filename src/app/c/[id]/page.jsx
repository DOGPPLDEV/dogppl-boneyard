import { redirect } from 'next/navigation';

// Direct-link route for /c/{concept_id}. The real UI version of this page
// opens the concept modal in place. For the scaffold, redirect to the
// index with the concept id in the URL so we have a known shape to wire
// modal-open behavior against once the UI lands.
export default function ConceptDirectLink({ params }) {
  redirect(`/?concept=${encodeURIComponent(params.id)}`);
}
