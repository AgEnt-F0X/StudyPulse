import { forwardRef } from 'react'

const Input = forwardRef(({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  icon: IconComp,
  disabled,
  className = '',
  autoComplete,
  ...props
}, ref) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-xs"
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: '0.01em',
            color: 'var(--text-secondary, #a7c4b5)',
            paddingLeft: IconComp ? '0.5rem' : '0',
          }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {IconComp && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted, #769989)' }}
          >
            <IconComp size={16} strokeWidth={1.75} style={{ display: 'block' }} />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`
            input-sa w-full box-border
            focus-visible:ring-2 focus-visible:ring-primary/30
            ${IconComp ? 'pl-10' : ''}
            ${error ? 'border-red-400' : ''}
          `}
          {...props}
        />
      </div>
      {error && (
        <p
          className="text-xs"
          style={{ color: '#f87171', fontWeight: 500, fontFamily: "'Manrope', sans-serif", paddingLeft: IconComp ? '0.5rem' : '0' }}
        >
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
