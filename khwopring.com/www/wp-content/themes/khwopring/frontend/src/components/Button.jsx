import { Link } from 'react-router-dom'

const variants = {
  primary: 'btn-primary',
  outline: 'btn-outline',
}

export default function Button({ to, href, variant = 'primary', className = '', children, ...props }) {
  const classes = `${variants[variant] ?? variants.primary} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}
