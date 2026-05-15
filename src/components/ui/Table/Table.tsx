import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '../cn'
import styles from './Table.module.css'

export function Table({ children, className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className={styles.wrapper}>
      <table className={cn(styles.table, className)} {...props}>
        {children}
      </table>
    </div>
  )
}

export function TableHead({ children, className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn(styles.thead, className)} {...props}>
      {children}
    </thead>
  )
}

export function TableBody({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props}>{children}</tbody>
}

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean
}

export function TableRow({ children, selected, className, ...props }: TableRowProps) {
  return (
    <tr className={cn(styles.row, selected && styles['row--selected'], className)} {...props}>
      {children}
    </tr>
  )
}

export function TableCell({ children, className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn(styles.cell, className)} {...props}>
      {children}
    </td>
  )
}

export function TableHeaderCell({ children, className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn(styles.headerCell, className)} {...props}>
      {children}
    </th>
  )
}
