'use client';

export default function AniListStats() {
  const watched = 341;
  const target = 400;
  const percentage = Math.min(100, Math.round((watched / target) * 100));

  return (
    <div className="anilist-stats-container">
      {/* Progress bar to 400 Anime Watched */}
      <div className="anilist-progress-wrapper">
        <div className="anilist-progress-header">
          <span className="progress-label">Goal Progress (400 Anime)</span>
          <span className="progress-value">{watched} / {target} ({percentage}%)</span>
        </div>
        <div className="anilist-progress-track">
          <div
            className="anilist-progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Grid of stats from image */}
      <div className="anilist-stats-grid">
        <div className="stat-box">
          <div className="stat-number">
            341 <span className="stat-icon">📺</span>
          </div>
          <div className="stat-label">Anime Watched</div>
        </div>

        <div className="stat-box">
          <div className="stat-number">
            4.4K <span className="stat-icon">▶</span>
          </div>
          <div className="stat-label">Episodes Watched</div>
        </div>

        <div className="stat-box">
          <div className="stat-number">
            1,831h <span className="stat-icon">🕒</span>
          </div>
          <div className="stat-label">Hours Watched</div>
        </div>

        <div className="stat-box">
          <div className="stat-number">
            1,375h <span className="stat-icon">⌛</span>
          </div>
          <div className="stat-label">Hours Planned</div>
        </div>

        <div className="stat-box">
          <div className="stat-number">
            4,288 <span className="stat-icon">📖</span>
          </div>
          <div className="stat-label">Chapters Read</div>
        </div>

        <div className="stat-box">
          <div className="stat-number">
            19 Watching <span className="stat-icon">👀</span>
          </div>
          <div className="stat-label">☀️ Summer 2026</div>
        </div>
      </div>
    </div>
  );
}
