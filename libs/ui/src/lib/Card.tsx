import { ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: ReactNode;
  title?: string;
  footer?: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({
  children,
  title,
  footer,
  className = '',
  onClick,
  hoverable = false,
}: CardProps) {
  const cardClass = `${styles.card} ${hoverable ? styles.hoverable : ''} ${className}`;
  
  return (
    <div className={cardClass} onClick={onClick}>
      {title && <div className={styles.cardHeader}>{title}</div>}
      <div className={styles.cardBody}>{children}</div>
      {footer && <div className={styles.cardFooter}>{footer}</div>}
    </div>
  );
}

export default Card; 