-- Remove "Rewards in Motion" section (MGM Grand Las Vegas, Leaderboard) from December 24 bulletin
UPDATE advisor_content
SET content = REPLACE(
  content,
  '<h3 style="text-align: center; font-size: 22px; font-weight: 700; color: #000000; margin: 32px 0 24px 0; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">Rewards in Motion</h3>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">MGM Grand Las Vegas!</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 16px 0;">Open Enrollment is almost here, are you going to LAS VEGAS!? Let us know how we can support you! This is the time to take advantage of all the ACA changes coming through.</p>

<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 24px 0; border-radius: 12px;">
  <iframe src="https://player.vimeo.com/video/1121281554?dnt=1&app_id=122963" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 12px;" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" allowfullscreen></iframe>
</div>

<p style="margin: 0 0 16px 0;"><a href="https://advisor.mpb.health/zion-healthshare-contest/" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Leaderboard</a></p>',
  ''
)
WHERE slug = 'advisor-bulletin-december-24-2025' AND content_type = 'bulletin';
