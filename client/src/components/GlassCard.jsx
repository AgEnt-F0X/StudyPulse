import BentoCard from './BentoCard'

// Legacy compat — GlassCard now renders Botanical Bento surface.
// New code should import BentoCard directly.
const GlassCard = ({ children, ...props }) => {
  return <BentoCard {...props}>{children}</BentoCard>
}

export default GlassCard
