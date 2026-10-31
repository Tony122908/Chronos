import { Importance, IMPORTANCE, taskColor } from '../../back/lib/tasks'
import { Level } from '../../back/engine/levels'
import { TemporalBreadcrumb } from './TemporalBreadcrumb'

type Props = {
  theme: 'light' | 'dark'
  shown: readonly boolean[]
  onTheme: () => void
  onToggleImportance: (importance: Importance) => void
  onToday: () => void
  onNewTask: () => void
  onZoom: (step: 1 | -1) => void
  focusMs: number
  level: Level
  onDirectLevel: (level: Level, anchorMs: number) => void
}

export function Header({ theme, shown, onTheme, onToggleImportance, onToday, onNewTask, onZoom, focusMs, level, onDirectLevel }: Props) {
  return <header className="app-header">
    <div className="brand">
      <span>CHRONOS</span>
      <small>Time, without boundaries.</small>
      <TemporalBreadcrumb focusMs={focusMs} level={level} onLevel={onDirectLevel} />
    </div>
    <nav aria-label="Timeline controls">
      <div className="importance-filter" role="group" aria-label="Show tasks by importance">
        {IMPORTANCE.map((level, i) => (
          <button key={level.name} aria-pressed={shown[i]} title={`${shown[i] ? 'Hide' : 'Show'} ${level.name.toLowerCase()} importance tasks`}
            style={{ '--dot': taskColor(i as Importance, 100) } as React.CSSProperties} onClick={() => onToggleImportance(i as Importance)}>
            <i />
          </button>
        ))}
      </div>
      <button className="today" onClick={onToday} title="Return to today (T)">Today</button>
      <button className="new-task" onClick={onNewTask}><span aria-hidden="true">+</span> New Task</button>
      <span className="zoom-cluster">
        <button aria-label="Zoom out" onClick={() => onZoom(-1)}>−</button>
        <button aria-label="Zoom in" onClick={() => onZoom(1)}>+</button>
      </span>
      <button className="theme-toggle" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} onClick={onTheme}>
        {theme === 'light' ? '◐' : '◑'}
      </button>
    </nav>
  </header>
}
