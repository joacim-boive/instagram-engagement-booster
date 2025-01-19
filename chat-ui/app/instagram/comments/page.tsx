import { CommentResponsePanel } from './components/comment-response-panel';

export default function CommentsPage() {
  return (
    <div className="container py-6 mx-auto">
      <h1 className="mb-6 text-2xl font-bold">Instagram Comment Responses</h1>
      <CommentResponsePanel />
    </div>
  );
}
