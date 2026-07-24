import "./StarField.css";

/**
 * Zero-cost background used wherever the WebGL Galaxy is not worth its price:
 * mobile devices and `prefers-reduced-motion`.
 */
export function StarField() {
  return <div className="starfield" aria-hidden="true" />;
}
