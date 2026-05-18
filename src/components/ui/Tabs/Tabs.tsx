import { cn } from '../cn'
import styles from './Tabs.module.css'

export interface TabItem {
  id: string
  label: string
  disabled?: boolean
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
  variant?: 'line' | 'pill'
}

export function Tabs({ tabs, activeTab, onChange, variant = 'line' }: TabsProps) {
  return (
    <div className={cn(styles.tabs, styles[`tabs--${variant}`])} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          type="button"
          aria-selected={tab.id === activeTab}
          disabled={tab.disabled}
          className={cn(styles.tab, tab.id === activeTab && styles['tab--active'])}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
