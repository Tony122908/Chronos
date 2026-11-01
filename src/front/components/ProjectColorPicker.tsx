import { PROJECT_COLORS, ProjectColor } from '../../back/lib/projects'

const LABELS: Record<ProjectColor, string> = {
  blue: 'Blue', teal: 'Teal', green: 'Green', yellow: 'Yellow',
  orange: 'Orange', red: 'Red', purple: 'Purple', graphite: 'Graphite',
}

type Props = { value: ProjectColor; onChange: (color: ProjectColor) => void; label?: string }

export function ProjectColorPicker({ value, onChange, label = 'Project color' }: Props) {
  return <div className="project-color-picker" role="radiogroup" aria-label={label}>
    {PROJECT_COLORS.map((color) => <button key={color} type="button" role="radio" aria-checked={value === color}
      aria-label={LABELS[color]} title={LABELS[color]} className={`project-color-choice project-${color}`}
      onClick={() => onChange(color)}><span aria-hidden="true">✓</span></button>)}
  </div>
}
