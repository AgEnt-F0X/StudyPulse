import { C, tint } from '../utils/theme'

// Optical icon frame — 32/40px squircle, 10% tint, 1.75 stroke.
// Unifies icon presentation everywhere (Sidebar, PageHeader, Stats).
const IconBadge = ({
  icon: Icon,
  color,
  size = 36,
  iconSize,
  weight = 'duotone',
  style,
  ...props
}) => {
  const accent = color || 'var(--primary, #10b981)'
  const glyph = iconSize || (size <= 32 ? 16 : 18)
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        flexShrink: 0,
        background: tint(typeof accent === 'string' && accent.startsWith('var(') ? '#10b981' : accent, 0.10),
        border: `1px solid ${tint(typeof accent === 'string' && accent.startsWith('var(') ? '#10b981' : accent, 0.25)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: accent,
        ...style,
      }}
      {...props}
    >
      {Icon && <Icon size={glyph} weight={weight} style={{ display: 'block' }} />}
    </div>
  )
}

export default IconBadge
export { C }
