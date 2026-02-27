import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.gradientOrb1}></div>
          <div className={styles.gradientOrb2}></div>
          <div className={styles.gradientOrb3}></div>
        </div>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            🎓 学生限定プラットフォーム
          </div>
          <h1 className={styles.title}>
            起業の仲間を見つける。<br />
            <span className={styles.titleGradient}>アイデアをカタチにする。</span>
          </h1>
          <p className={styles.subtitle}>
            UniMatchは、起業を目指す学生がスキルを持つ仲間とつながり、チームを組んでプロジェクトを実現するためのプラットフォームです。
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/login" className="btn btn-primary btn-lg">
              今すぐ始める →
            </Link>
            <Link href="/board" className="btn btn-secondary btn-lg">
              掲示板を見る
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>UniMatchでできること</h2>
        <p className={styles.sectionSubtitle}>起業チーム結成に必要なすべてが揃っています</p>
        <div className={styles.featuresGrid}>
          <div className={`${styles.featureCard} glass-card`}>
            <span className={styles.featureIcon}>🔍</span>
            <h3 className={styles.featureTitle}>スキルマッチング</h3>
            <p className={styles.featureDesc}>
              エンジニア、デザイナー、ビジネスなど、プロジェクトに必要なスキルを持つ仲間を簡単に見つけられます。
            </p>
          </div>
          <div className={`${styles.featureCard} glass-card`}>
            <span className={styles.featureIcon}>📋</span>
            <h3 className={styles.featureTitle}>プロジェクト掲示板</h3>
            <p className={styles.featureDesc}>
              起業アイデアを投稿し、共感するメンバーを募集。フィルタ機能で自分に合ったプロジェクトを発見。
            </p>
          </div>
          <div className={`${styles.featureCard} glass-card`}>
            <span className={styles.featureIcon}>🎓</span>
            <h3 className={styles.featureTitle}>学生限定で安心</h3>
            <p className={styles.featureDesc}>
              大学メールアドレスで認証するため、学生同士の安全なコミュニティが保証されます。
            </p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>はじめるのは簡単</h2>
        <p className={styles.sectionSubtitle}>4ステップで起業チームを結成</p>
        <div className={styles.stepsGrid}>
          <div className={`${styles.stepCard} glass-card`}>
            <div className={styles.stepNumber}>1</div>
            <h3 className={styles.stepTitle}>学生認証</h3>
            <p className={styles.stepDesc}>大学メールアドレスで簡単に登録・認証</p>
          </div>
          <div className={`${styles.stepCard} glass-card`}>
            <div className={styles.stepNumber}>2</div>
            <h3 className={styles.stepTitle}>プロフィール作成</h3>
            <p className={styles.stepDesc}>自分のスキルと興味分野を登録</p>
          </div>
          <div className={`${styles.stepCard} glass-card`}>
            <div className={styles.stepNumber}>3</div>
            <h3 className={styles.stepTitle}>仲間を探す</h3>
            <p className={styles.stepDesc}>掲示板で興味のあるプロジェクトに参加申請</p>
          </div>
          <div className={`${styles.stepCard} glass-card`}>
            <div className={styles.stepNumber}>4</div>
            <h3 className={styles.stepTitle}>チーム結成</h3>
            <p className={styles.stepDesc}>メンバーが揃ったらプロジェクト開始！</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className={styles.statsGrid}>
          <div>
            <div className={styles.statValue}>500+</div>
            <div className={styles.statLabel}>登録学生数</div>
          </div>
          <div>
            <div className={styles.statValue}>120+</div>
            <div className={styles.statLabel}>プロジェクト数</div>
          </div>
          <div>
            <div className={styles.statValue}>50+</div>
            <div className={styles.statLabel}>連携大学数</div>
          </div>
          <div>
            <div className={styles.statValue}>30+</div>
            <div className={styles.statLabel}>チーム結成数</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaSectionTitle}>仲間を見つけて、今すぐ始めよう</h2>
        <p className={styles.ctaSectionDesc}>
          あなたのアイデアに足りないスキルを補えるチームメンバーが、きっと見つかります。
        </p>
        <Link href="/login" className="btn btn-primary btn-lg">
          無料で登録する →
        </Link>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 UniMatch — 学生起業マッチングプラットフォーム</p>
      </footer>
    </>
  );
}
