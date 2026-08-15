export default function LazyImage({ src, alt = '', className = '', ...props }) {
  if (!src) {
    return <div className={`bg-navy/10 ${className}`} aria-hidden="true" />
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={className} {...props} />
}
