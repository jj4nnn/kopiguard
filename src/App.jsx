import React, { useState, useEffect } from 'react';
import { evaluatePost, testConnection } from './api/gemini';

export default function App() {
  // Stats counters
  const [auditsCount, setAuditsCount] = useState(68);
  const [blockedCount, setBlockedCount] = useState(14);

  // Scanning State
  const [scanning, setScanning] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  
  // Evaluation target
  const [activePostId, setActivePostId] = useState(null);

  // Modals & Analysis results
  const [activeModal, setActiveModal] = useState(null); // 'scam' | 'harmless' | 'authentic' | null
  const [activeAnalysis, setActiveAnalysis] = useState({
    isAIGenerated: false,
    isFinancialScam: false,
    confidenceAI: 0,
    explanation: ''
  });
  
  // Modal Safety Shake State
  const [shakeScam, setShakeScam] = useState(false);
  const [shakeHarmless, setShakeHarmless] = useState(false);
  const [shakeAuthentic, setShakeAuthentic] = useState(false);

  // Toast Alerts
  const [toasts, setToasts] = useState([]);

  // Default timeline posts
  const [posts, setPosts] = useState([
    {
      id: 'card-a',
      isAd: true,
      profileName: 'SG Wealth Retirement Fund',
      avatarIcon: 'fa-sack-dollar',
      avatarType: 'scam',
      timeElapsed: 'Just now',
      sponsoredText: 'Sponsored',
      contentText: 'Official Government Retirement Payout Scheme – Verify bank details now to claim your $2,000 bonus immediately. 💰💰',
      urgencyText: '⚠️ WARNING: Verification closes in 3 hours! Fill in bank details now! ⚠️',
      mediaImage: '/pm_lee.png',
      mediaDuration: '1:45',
      mediaBadge: 'LIVE',
      isLive: true,
      headlineDomain: 'GOV.PAYOUT-PORTAL.NET',
      headlineTitle: 'SG Seniors $2,000 Payout Verification',
      headlineAction: 'Verify Now',
      likesCount: '14.2K likes',
      commentsCount: '2.8K comments',
      sharesCount: '950 shares',
      keywords: 'AI video, cloned digital voice, synthetic footage, deepfake, PM Lee, official scheme, payout',
      isBlocked: false,
      blockedReason: ''
    },
    {
      id: 'card-c',
      isAd: false,
      profileName: 'Sci-Fi Creators & Futurism',
      avatarIcon: 'fa-wand-magic-sparkles',
      avatarType: 'ai',
      timeElapsed: '45 mins ago',
      sponsoredText: 'AI Art',
      sponsoredColor: 'tag-purple',
      contentText: 'Watch these cute glowing blue aliens dancing with people in our local park! Completely created using AI generative algorithms. Isn\'t tech amazing? 💫🎨',
      mediaImage: '/aliens.png',
      mediaDuration: '0:45',
      mediaBadge: 'GENERATED',
      isGenerated: true,
      headlineDomain: 'FUTUREART.CREATIONS',
      headlineTitle: 'Surreal Aliens in Singapore Park - Generative Video',
      headlineAction: 'Watch HD',
      likesCount: '245 likes',
      commentsCount: '42 comments',
      sharesCount: '12 shares',
      keywords: 'AI video, aliens, synthetic footage, generative, art, surreal',
      isBlocked: false,
      blockedReason: ''
    },
    {
      id: 'card-b',
      isAd: true,
      profileName: 'SG Citizens Grant Allocation',
      avatarIcon: 'fa-landmark',
      avatarType: 'scam',
      timeElapsed: '5 mins ago',
      sponsoredText: 'Sponsored',
      contentText: 'All Singapore citizens aged 50 and above are eligible. Click here to verify your identity and bank account info to receive the grant in 5 minutes! 💰👇',
      urgencyText: '⚠️ ALARM: Slots are running out fast! Register now! ⚠️',
      mediaImage: '/lawrence_wong.png',
      mediaDuration: '2:10',
      mediaBadge: 'RECORDED',
      headlineDomain: 'GOV-GRANTS-VERIFY.ORG',
      headlineTitle: '$500 Household Support Scheme Verification',
      headlineAction: 'Claim Now',
      likesCount: '8.7K likes',
      commentsCount: '1.5K comments',
      sharesCount: '420 shares',
      keywords: 'AI video, cloned digital voice, synthetic footage, deepfake, Lawrence Wong, household grant, bonus',
      isBlocked: false,
      blockedReason: ''
    },
    {
      id: 'card-d',
      isAd: false,
      profileName: 'Mdm Chen',
      profilePic: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      timeElapsed: '3 hours ago',
      contentText: 'Really satisfied with the family photo taken today. Now I\'ll have something to frame up in my living room! 🌳 Family is life\'s greatest blessing. ❤️ #familylove #sundayblessings',
      mediaImage: '/familypic.png',
      likesCount: 'Aunty Helen and 84 others',
      commentsCount: '19 comments',
      sharesCount: '4 shares',
      keywords: 'family photo, park, real, human, natural',
      isBlocked: false,
      blockedReason: ''
    },
    {
      id: 'card-e',
      isAd: false,
      profileName: 'Marcus Tan',
      profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      timeElapsed: '1 hour ago',
      contentText: 'Nothing beats a hot bowl of Laksa on a rainy Sunday afternoon! 🍜 Who else is craving this right now? #SGfood #coffeeshop #shiok',
      mediaImage: '/awesomelaksa.png',
      likesCount: 'Uncle Tan and 156 others',
      commentsCount: '32 comments',
      sharesCount: '15 shares',
      keywords: 'Singapore food, laksa, coffeeshop, real, human, authentic',
      isBlocked: false,
      blockedReason: ''
    }
  ]);

  // Toast triggers
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Connection Test Handler
  const handleTestConnection = async () => {
    setTestingConnection(true);
    const result = await testConnection();
    setTestingConnection(false);
    if (result.success) {
      addToast(result.message, 'success');
    } else {
      addToast(result.message, 'info');
    }
  };

  // Run pipeline
  const runScanningPipeline = async (text, keywords, id) => {
    setScanning(true);
    setActivePostId(id);

    // Simulate forensic scanning latency
    setTimeout(async () => {
      setAuditsCount(prev => prev + 1);
      
      const result = await evaluatePost(text, keywords);
      setActiveAnalysis(result);
      setScanning(false);

      if (result.isAIGenerated && result.isFinancialScam) {
        setActiveModal('scam');
      } else if (result.isAIGenerated && !result.isFinancialScam) {
        setActiveModal('harmless');
      } else {
        setActiveModal('authentic');
      }
    }, 2000);
  };

  // Block Modal Handler
  const handleBlockReportScam = () => {
    let blockReason = 'Deepfake investment/grant advertisement reported to authorities.';
    if (activePostId === 'card-a') {
      blockReason = 'Lee Hsien Loong fake investment ad blocked and reported to SPF.';
    } else if (activePostId === 'card-b') {
      blockReason = 'PM Lawrence Wong fake government grant ad blocked and reported to SPF.';
    }

    setPosts(prev => prev.map(post => 
      post.id === activePostId ? { ...post, isBlocked: true, blockedReason } : post
    ));

    setBlockedCount(prev => prev + 1);
    setActiveModal(null);
    addToast('Ad blocked and reported successfully!', 'success');
  };

  // Block Harmless Ad
  const handleBlockHarmless = () => {
    setPosts(prev => prev.map(post => 
      post.id === activePostId ? { ...post, isBlocked: true, blockedReason: 'Synthetic/AI-Generated media ad blocked.' } : post
    ));

    setBlockedCount(prev => prev + 1);
    setActiveModal(null);
    addToast('Ad blocked successfully!', 'success');
  };

  // Share Anyway
  const handleShareAnyway = () => {
    setActiveModal(null);
    addToast('Shared to profile!', 'share');
  };

  // Continue to Share (Authentic)
  const handleContinueShare = () => {
    setActiveModal(null);
    addToast('Successfully shared to timeline!', 'success');
  };

  // Safety shake trigger
  const triggerShake = (modalType) => {
    if (modalType === 'scam') {
      setShakeScam(true);
      setTimeout(() => setShakeScam(false), 300);
    } else if (modalType === 'harmless') {
      setShakeHarmless(true);
      setTimeout(() => setShakeHarmless(false), 300);
    } else if (modalType === 'authentic') {
      setShakeAuthentic(true);
      setTimeout(() => setShakeAuthentic(false), 300);
    }
  };

  return (
    <div className="app-wrapper">
      {/* Full-Width Sticky Header */}
      <header className="app-header">
        <div className="header-left">
          <span className="logo-text">KopiBook</span>
          <div className="header-search-bar">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input type="text" placeholder="Search KopiBook..." disabled />
          </div>
        </div>
        
        <nav className="header-nav-tabs">
          <button className="nav-tab active" title="Home"><i className="fa-solid fa-house"></i></button>
          <button className="nav-tab" title="Friends"><i className="fa-solid fa-user-group"></i></button>
          <button className="nav-tab" title="Watch"><i className="fa-solid fa-tv"></i></button>
          <button className="nav-tab" title="Groups"><i className="fa-solid fa-users"></i></button>
        </nav>

        <div className="header-right">
          <div className="kopiguard-pill">
            <span className="pulse-dot"></span>
            <span className="pill-text"><i className="fa-solid fa-shield-halved"></i> KopiGuard Active</span>
          </div>
          <button className="action-btn" aria-label="Messenger"><i className="fa-brands fa-facebook-messenger"></i></button>
          <button className="action-btn" aria-label="Notifications"><i className="fa-solid fa-bell"></i><span className="badge-dot"></span></button>
          <img className="header-avatar" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80" alt="User Avatar" />
        </div>
      </header>

      {/* Main Grid */}
      <div className="dashboard-grid">
        
        {/* LEFT SIDEBAR */}
        <aside className="sidebar sidebar-left">
          <div className="sidebar-card guard-dashboard">
            <div className="guard-dashboard-header">
              <i className="fa-solid fa-user-shield dashboard-shield-icon"></i>
              <div>
                <h3>KopiGuard AI</h3>
                <span className="guard-version">v3.0 Dynamic Engine</span>
              </div>
            </div>

            <div className="guard-status-widget">
              <div className="widget-row">
                <span>System Shield</span>
                <span className="text-success font-bold"><i class="fa-solid fa-circle-check"></i> ACTIVE</span>
              </div>
              <div className="widget-row">
                <span>Deepfake Defense</span>
                <span className="text-success font-bold"><i class="fa-solid fa-circle-check"></i> SHIELDING</span>
              </div>
              <div className="widget-row">
                <span>Scan Accuracy</span>
                <span className="font-bold">98.6%</span>
              </div>
            </div>

            <hr className="widget-divider" />

            <div className="guard-stats">
              <h4>Live Scan Log Counters:</h4>
              <div className="stats-grid">
                <div className="stat-box">
                  <span className="stat-number text-danger">{blockedCount}</span>
                  <span className="stat-label">Scams Blocked</span>
                </div>
                <div className="stat-box">
                  <span className="stat-number text-sky">{auditsCount}</span>
                  <span className="stat-label">Posts Audited</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '0 8px', marginBottom: '12px' }}>
              <button 
                onClick={handleTestConnection}
                disabled={testingConnection}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)';
                  e.currentTarget.style.border = '1px solid rgba(56, 189, 248, 0.6)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.border = '1px solid rgba(56, 189, 248, 0.3)';
                }}
              >
                {testingConnection ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Testing API...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-plug"></i> Test AI Connection
                  </>
                )}
              </button>
            </div>

            <div className="guard-banner-small">
              <i className="fa-solid fa-code-compare"></i>
              <span>Real-time heuristic natural language & forensic parsing.</span>
            </div>
          </div>

          <div className="sidebar-links">
            <a href="#" className="sidebar-link active"><i className="fa-solid fa-newspaper text-blue"></i> News Feed</a>
            <a href="#" className="sidebar-link"><i className="fa-solid fa-user-group text-teal"></i> Friends</a>
            <a href="#" className="sidebar-link"><i className="fa-solid fa-users text-indigo"></i> Groups</a>
            <a href="#" class="sidebar-link"><i className="fa-solid fa-bookmark text-pink"></i> Saved</a>
          </div>
        </aside>

        {/* CENTER COLUMN: FEED */}
        <main className="timeline-feed">

          {/* TIMELINE CARDS */}
          {posts.map((post) => (
            post.isBlocked ? (
              <div 
                key={post.id} 
                className="feed-card" 
                style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  border: '2px dashed #dc2626', 
                  backgroundColor: '#fef2f2', 
                  borderRadius: '12px',
                  margin: '0 8px 8px 8px',
                  color: '#991b1b',
                  fontWeight: '700',
                  fontFamily: 'Outfit, sans-serif'
                }}
              >
                <i className="fa-solid fa-user-shield" style={{ fontSize: '26px', color: '#dc2626', marginBottom: '6px', display: 'block' }}></i>
                🚨 Ad Blocked & Reported
                <span style={{ display: 'block', fontSize: '12px', color: '#7f1d1d', fontWeight: '500', marginTop: '4px' }}>
                  {post.blockedReason}
                </span>
              </div>
            ) : (
              <article key={post.id} className={`feed-card ${post.isAd ? 'ad-card' : ''}`} id={post.id}>
                <div className="card-header">
                  <div className="profile-pic-container">
                    {post.profilePic ? (
                      <img className="profile-pic" src={post.profilePic} alt={post.profileName} />
                    ) : (
                      <div className={`${post.avatarType}-avatar-wrapper`}>
                        <i className={`fa-solid ${post.avatarIcon}`}></i>
                      </div>
                    )}
                  </div>
                  <div className="header-info">
                    <div className="profile-name-row">
                      <h2 className="profile-name">{post.profileName}</h2>
                      {post.sponsoredText && (
                        <span className={`sponsored-tag ${post.sponsoredColor || ''}`}>{post.sponsoredText}</span>
                      )}
                    </div>
                    <div className="post-meta">
                      <span className="time-elapsed">{post.timeElapsed}</span>
                      <span className="separator">·</span>
                      <i className="fa-solid fa-earth-americas privacy-icon" title="Public"></i>
                    </div>
                  </div>
                  <button className="more-options-btn" aria-label="Options"><i className="fa-solid fa-ellipsis"></i></button>
                </div>

                <div className="card-content-text">
                  {post.isAd ? (
                    <div className="scam-text">
                      🇸🇬 <strong>OFFICIAL GOVERNMENT NOTICE:</strong> 🇸🇬<br />
                      {post.contentText}<br />
                      <span className="urgency-text">{post.urgencyText}</span>
                    </div>
                  ) : post.isGenerated ? (
                    <div className="ai-label-text">
                      👽 <strong>AI ART PREVIEW:</strong> 👽<br />
                      {post.contentText}
                    </div>
                  ) : (
                    post.contentText
                  )}
                </div>

                <div className="card-media">
                  <img src={post.mediaImage} alt={post.profileName} className="media-image" />
                  {post.mediaDuration && (
                    <div className="video-overlay">
                      <div className="play-button-wrapper">
                        <i className="fa-solid fa-play"></i>
                      </div>
                      <div className="video-duration">{post.mediaDuration}</div>
                      <div className={`video-live-badge ${post.isGenerated ? 'badge-purple' : ''}`}>
                        {post.isGenerated && <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: '4px' }}></i>}
                        {post.isLive && <span className="live-dot"></span>}
                        {post.mediaBadge}
                      </div>
                    </div>
                  )}
                </div>

                {post.headlineTitle && (
                  <div className="headline-bar">
                    <div className="headline-left">
                      <span className="headline-domain">{post.headlineDomain}</span>
                      <h3 className="headline-title">{post.headlineTitle}</h3>
                    </div>
                    <button className="headline-action-btn">{post.headlineAction}</button>
                  </div>
                )}

                <div className="interactions-counter">
                  <div className="likes-count">
                    <span className="like-icons">
                      <i className="fa-solid fa-thumbs-up-circle like-icon-blue"></i>
                      <i className={`fa-solid ${post.isGenerated ? 'fa-face-smile smile-icon-yellow' : 'fa-heart-circle heart-icon-red'}`}></i>
                    </span>
                    <span className="counter-text">{post.likesCount}</span>
                  </div>
                  <div className="comments-shares-count">
                    <span>{post.commentsCount}</span>
                    <span className="separator">·</span>
                    <span>{post.sharesCount}</span>
                  </div>
                </div>

                <div className="card-actions">
                  <button className="action-trigger-btn"><i className="fa-regular fa-thumbs-up"></i> Like</button>
                  <button className="action-trigger-btn"><i className="fa-regular fa-comment"></i> Comment</button>
                  <button 
                    className="action-trigger-btn btn-share"
                    onClick={() => runScanningPipeline(post.contentText, post.keywords, post.id)}
                  >
                    <i className="fa-solid fa-share-nodes"></i> Share
                  </button>
                </div>
              </article>
            )
          ))}

          <div className="feed-end-message">
            <i className="fa-solid fa-circle-check"></i> You're all caught up for today.
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="sidebar sidebar-right">
          <div className="sidebar-card safety-tips">
            <h3><i className="fa-solid fa-circle-info text-amber"></i> Ah Ma's Safety Tips</h3>
            <ul className="tips-list">
              <li>
                <span className="tip-number">1</span>
                <div>
                  <strong>Verify the Source:</strong> Official Singapore government messages will always come from a <strong>.gov.sg</strong> domain.
                </div>
              </li>
              <li>
                <span className="tip-number">2</span>
                <div>
                  <strong>Check Lips & Voice:</strong> Deepfakes often have lip movements that don't match the voice, or strange electronic robot tones.
                </div>
              </li>
              <li>
                <span className="tip-number">3</span>
                <div>
                  <strong>Never Share OTPs:</strong> No government official will ever ask you to verify your bank details or OTP in a Facebook ad.
                </div>
              </li>
            </ul>
          </div>

          <div className="sidebar-card hotlines-card">
            <h3><i className="fa-solid fa-phone-volume text-success"></i> Singapore Help Lines</h3>
            <div className="hotline-item">
              <span>Anti-Scam Hotline:</span>
              <strong>1800-722-6688</strong>
            </div>
            <div className="hotline-item">
              <span>Police Emergency:</span>
              <strong>999</strong>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Nav on Mobile */}
      <nav className="bottom-nav">
        <button className="nav-item active"><i className="fa-solid fa-house"></i><span>Home</span></button>
        <button className="nav-item"><i className="fa-solid fa-user-group"></i><span>Friends</span></button>
        <button className="nav-item"><i className="fa-solid fa-tv"></i><span>Watch</span></button>
        <button className="nav-item"><i className="fa-solid fa-bell"></i><span className="badge">3</span><span>Notifications</span></button>
        <button className="nav-item"><i className="fa-solid fa-bars"></i><span>Menu</span></button>
      </nav>

      {/* SCANNING OVERLAY */}
      {scanning && (
        <div className="loading-overlay active">
          <div className="loader-content">
            <div className="scanner-container">
              <div className="shield-scanner">
                <i className="fa-solid fa-shield-halved main-shield"></i>
                <div className="scan-laser"></div>
              </div>
              <div className="circular-spinner"></div>
            </div>
            <p className="loader-text">Scanning...</p>
          </div>
        </div>
      )}

      {/* MODAL 1: SCAM ALERT (RED) */}
      {activeModal === 'scam' && (
        <div 
          className="modal-overlay active"
          onClick={(e) => e.target === e.currentTarget && triggerShake('scam')}
        >
          <div className={`modal-card card-scam-alert ${shakeScam ? 'modal-shake' : ''}`}>
            <div className="modal-banner banner-red">
              <i className="fa-solid fa-circle-exclamation modal-alert-icon animate-pulse"></i>
              <h2>SCAM DETECTED</h2>
            </div>
            <div className="modal-body">
              <div className="alert-box box-red">
                <p className="modal-warning-text text-red-bold">
                  {activeAnalysis.explanation}
                </p>
              </div>
              
              <div className="scan-breakdown">
                <h3><i className="fa-solid fa-magnifying-glass-chart"></i> Forensics Verification Engine:</h3>
                <div className="progress-container">
                  <span className="progress-label">AI Manipulation Match:</span>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill fill-red" style={{ width: `${activeAnalysis.confidenceAI}%` }}>
                      {activeAnalysis.confidenceAI}% Scam Threat
                    </div>
                  </div>
                </div>
                <ul className="breakdown-details">
                  <li><i className="fa-solid fa-triangle-exclamation text-red"></i> <strong>Forensics:</strong> Biometric anomalies matching known SPF fraud data patterns.</li>
                  <li><i class="fa-solid fa-triangle-exclamation text-red"></i> <strong>Context:</strong> Government spoofing & unauthorized financial requests.</li>
                </ul>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-primary-scam" onClick={handleBlockReportScam}>
                <i className="fa-solid fa-user-shield"></i> Block and Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AI MEDIA ALERT (YELLOW) */}
      {activeModal === 'harmless' && (
        <div 
          className="modal-overlay active"
          onClick={(e) => e.target === e.currentTarget && triggerShake('harmless')}
        >
          <div className={`modal-card card-harmless-warning ${shakeHarmless ? 'modal-shake' : ''}`}>
            <div className="modal-banner banner-yellow">
              <i className="fa-solid fa-wand-magic-sparkles modal-alert-icon icon-dark animate-pulse"></i>
              <h2>AI MEDIA DETECTED</h2>
            </div>
            <div className="modal-body">
              <div className="alert-box box-yellow">
                <p className="modal-warning-text text-yellow-bold">
                  {activeAnalysis.explanation}
                </p>
              </div>
              
              <div className="scan-breakdown">
                <h3><i className="fa-solid fa-chart-line"></i> Dynamic Threat Analysis:</h3>
                <div className="progress-container">
                  <span className="progress-label">AI Generation Signature:</span>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill fill-yellow" style={{ width: `${activeAnalysis.confidenceAI}%` }}>
                      {activeAnalysis.confidenceAI}% AI Generated
                    </div>
                  </div>
                </div>
                <ul className="breakdown-details">
                  <li><i className="fa-solid fa-circle-info text-yellow"></i> <strong>Forensics:</strong> Non-human motion patterns or surreal textures detected.</li>
                  <li><i class="fa-solid fa-circle-check text-green-check"></i> <strong>Threat Check:</strong> No active financial scams or phishing indicators found.</li>
                </ul>
              </div>
            </div>
            
            <div className="modal-footer flex-footer">
              <button className="btn-yellow-primary" onClick={handleBlockHarmless}>Block Ad</button>
              <button className="btn-yellow-secondary" onClick={handleShareAnyway}>Share Anyway</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AUTHENTIC CONTENT (GREEN) */}
      {activeModal === 'authentic' && (
        <div 
          className="modal-overlay active"
          onClick={(e) => e.target === e.currentTarget && triggerShake('authentic')}
        >
          <div className={`modal-card card-authentic-success ${shakeAuthentic ? 'modal-shake' : ''}`}>
            <div className="modal-banner banner-green">
              <div className="success-badge-container">
                <i className="fa-solid fa-circle-check success-check-icon animate-pulse"></i>
              </div>
              <h2>AUTHENTIC CONTENT</h2>
            </div>
            <div className="modal-body">
              <div className="alert-box box-green">
                <p className="modal-verified-text">
                  {activeAnalysis.explanation}
                </p>
              </div>
              
              <div className="scan-breakdown">
                <h3><i className="fa-solid fa-shield-halved"></i> Manipulation Checks:</h3>
                <div className="progress-container">
                  <span className="progress-label">AI Generated Footprint:</span>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill fill-green" style={{ width: `${activeAnalysis.confidenceAI}%` }}>
                      {activeAnalysis.confidenceAI}% AI (Safe)
                    </div>
                  </div>
                </div>
                <ul className="breakdown-details">
                  <li><i className="fa-solid fa-circle-check text-green-check"></i> <strong>Texture Consistency:</strong> Natural human motion signatures.</li>
                  <li><i class="fa-solid fa-circle-check text-green-check"></i> <strong>Verification:</strong> Cleared all synthetic voice and image heuristics.</li>
                </ul>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-green-primary" onClick={handleContinueShare}>
                <i className="fa-solid fa-share-nodes"></i> Continue to Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST SYSTEM */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type === 'success' ? 'toast-success' : ''}`}>
            {toast.type === 'success' && <i className="fa-solid fa-circle-check"></i>}
            {toast.type === 'share' && <i className="fa-solid fa-share-nodes"></i>}
            {toast.type === 'info' && <i className="fa-solid fa-circle-info"></i>}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
