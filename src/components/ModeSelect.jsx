import styles from './ModeSelect.module.css';

const MODES = [
  {
    id: '2player',
    icon: '🤝',
    label: '2 Players',
    desc: 'Pass & play on the same screen',
    cls: 'twoPlayer',
  },
  {
    id: 'bot-tiger',
    icon: '🐐',
    label: 'Play as Goat',
    desc: 'You control the goats — bot plays tigers',
    cls: 'vsBot',
  },
  {
    id: 'bot-goat',
    icon: '🐯',
    label: 'Play as Tiger',
    desc: 'You control the tigers — bot places & moves goats',
    cls: 'vsBot',
  },
  {
    id: 'online',
    icon: '🌐',
    label: 'Play Online',
    desc: 'Challenge a friend over the internet',
    cls: 'online',
  },
];

export function ModeSelect({ onSelect }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.heading}>
        <h1 className={styles.title}>Bāgh Chāl</h1>
        <p className={styles.subtitle}>Tigers &amp; Goats — Choose your game</p>
      </div>

      <div className={styles.cards}>
        {MODES.map(m => (
          <button
            key={m.id}
            className={`${styles.card} ${styles[m.cls]}`}
            onClick={() => onSelect(m.id)}
          >
            <span className={styles.icon}>{m.icon}</span>
            <span className={styles.label}>{m.label}</span>
            <span className={styles.desc}>{m.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
