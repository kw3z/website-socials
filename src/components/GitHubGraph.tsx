'use client';

export default function GitHubGraph() {
  // Generate 52 weeks x 7 days grid
  // Active commit positions based on 2026 contribution image:
  // - Apr: week ~14-16 (commit burst: green level 2 & 4)
  // - May: week ~17-18 (green level 3 & 1)
  // - Jun: week ~22-24 (green level 2 & 1)
  // - Jul: week ~26-27 (dark green level 4 & level 2)

  const activeMap: Record<string, number> = {
    '13-4': 1, // Apr Fri
    '14-6': 3, // Apr Sun
    '15-0': 4, // Apr Mon
    '15-6': 2, // Apr Sun
    '16-0': 3, // May Mon
    '22-3': 3, // Jun Wed
    '23-4': 1, // Jun Fri
    '24-1': 2, // Jul Tue
    '26-4': 4, // Jul Fri
  };

  const weeks = Array.from({ length: 52 }, (_, w) => w);

  return (
    <div className="github-graph-container">
      <div className="github-graph-header">
        <span className="github-graph-title">73 contributions in 2026</span>
      </div>

      <div className="github-graph-wrapper">
        <div className="github-graph-months">
          <span>Jan</span>
          <span>Feb</span>
          <span>Mar</span>
          <span>Apr</span>
          <span>May</span>
          <span>Jun</span>
          <span>Jul</span>
          <span>Aug</span>
          <span>Sep</span>
          <span>Oct</span>
          <span>Nov</span>
          <span>Dec</span>
        </div>

        <div className="github-graph-body">
          <div className="github-graph-days">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>

          <div className="github-graph-grid">
            {weeks.map((w) => (
              <div key={w} className="github-graph-col">
                {Array.from({ length: 7 }).map((_, d) => {
                  const level = activeMap[`${w}-${d}`] || 0;
                  return (
                    <div
                      key={d}
                      className={`github-square level-${level}`}
                      title={`${level > 0 ? `${level * 4} contributions` : 'No contributions'}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="github-graph-footer">
          <span className="footer-label">Learn how we count contributions</span>
          <div className="github-legend">
            <span>Less</span>
            <div className="github-square level-0" />
            <div className="github-square level-1" />
            <div className="github-square level-2" />
            <div className="github-square level-3" />
            <div className="github-square level-4" />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
