// Forum Module Exports (follows dashboard/daily index.ts pattern)

// Redux
export { forumApi, useFetchForumFeedQuery, useFetchForumThreadQuery, useFetchThreadSchemaQuery, useReactToPostMutation } from './redux_usecase/forumApi';
export type { ForumPost, ForumThread } from './redux_usecase/forumApi';

// Components
export { PostCard } from './components/PostCard';

// Pages
export { ForumPage } from './page/ForumPage';
