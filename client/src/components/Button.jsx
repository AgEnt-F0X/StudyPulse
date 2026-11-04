import { motion } from 'framer-motion'

// Botanical Scholar tactile buttons — gradients only on brand moments.
// primary: emerald action · amber: streak/XP/AI · secondary: frosted · ghost: minimal
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  onClick,
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  ...props
}) => {
  const sizes = {
    sm: 'text-xs py-1.5 px-3 rounded-lg',
    md: 'text-sm py-2 px-4 rounded-lg',
    lg: 'text-base py-2.5 px-6 rounded-lg',
  }

  const variantStyles = {
    primary: {
      background: 'var(--grad-primary)',
      color: '#04120c',
      border: 'none',
      boxShadow:
        'inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 32px color-mix(in srgb, var(--md-primary) 22%, transparent)',
    },
    amber: {
      background: 'var(--grad-reward)',
      color: '#1a1005',
      border: 'none',
      boxShadow:
        'inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 32px rgba(245,158,11,0.22)',
    },
    secondary: {
      background: 'var(--md-surface)',
      color: 'var(--md-text)',
      border: '1px solid var(--md-outline)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-primary, #f0fdf4)',
      border: '1px solid transparent',
      boxShadow: 'none',
    },
    danger: {
      background: '#f87171',
      color: '#140a0a',
      border: 'none',
      boxShadow: 'none',
    },
  }

  const resolved = variantStyles[variant] || variantStyles.primary

  return (
    <motion.button
      whileHover={disabled || loading ? {} : { scale: 1.02 }}
      whileTap={disabled || loading ? {} : { scale: 0.97 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        flex items-center justify-center gap-2 font-medium
        focus-ring transition-sa whitespace-nowrap
        focus-visible:ring-2 focus-visible:ring-primary/30
        ${sizes[size]}
        ${className}
      `}
      style={{
        ...resolved,
        borderRadius: 8,
        fontFamily: "var(--md-font-body)",
        fontWeight: 700,
        letterSpacing: '0.01em',
        padding: '0.625rem 1.25rem',
        minHeight: 36,
        opacity: disabled || loading ? 0.5 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '1rem' : '0.875rem',
      }}
      {...props}
    >
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }}
        />
      )}
      {Icon && !loading && (
        <Icon
          className="flex-shrink-0"
          size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16}
          strokeWidth={1.75}
          style={{ display: 'block' }}
        />
      )}
      {children}
    </motion.button>
  )
}

export default Button
