import "./StarField.css";

/**
 * The page background, shared by the homepage and the blog. Static CSS only:
 * see StarField.css for why the WebGL galaxy was retired.
 */
export function StarField() {
  return <div className="starfield" aria-hidden="true" />;
}
