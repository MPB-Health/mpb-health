export interface CertificateOptions {
  courseTitle?: string;
  subtitle?: string;
  badgeText?: string;
  quizDescription?: string;
}

export function generateCertificate(
  name: string,
  date: string,
  options?: CertificateOptions
): Promise<Blob> {
  const courseTitle = options?.courseTitle ?? 'Become an MPB Healthcare Advisor';
  const subtitle =
    options?.subtitle ??
    'and has demonstrated proficiency in MPB Health programs, membership benefits,\ncompliance guidelines, and healthcare advisory best practices.';
  const badgeText = options?.badgeText ?? 'MPB Health Certified Healthcare Advisor';
  const quizDescription = options?.quizDescription ?? 'Healthcare Advisor Certification Quiz';
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const W = 1400;
    const H = 1000;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, W - 60, H - 60);

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(45, 45, W - 90, H - 90);

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(100, 180, W - 200, 3);

    ctx.fillStyle = '#1e3a5f';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('MPB HEALTH', W / 2, 130);

    ctx.font = '14px Georgia, serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('MPowering Benefits Inc.', W / 2, 155);

    ctx.fillStyle = '#1e3a5f';
    ctx.font = '46px Georgia, serif';
    ctx.fillText('Certificate of Completion', W / 2, 260);

    ctx.fillStyle = '#64748b';
    ctx.font = '18px Georgia, serif';
    ctx.fillText('This is to certify that', W / 2, 330);

    ctx.fillStyle = '#1e3a5f';
    ctx.font = 'bold 42px Georgia, serif';
    ctx.fillText(name, W / 2, 400);

    const nameWidth = ctx.measureText(name).width;
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(W / 2 - nameWidth / 2 - 20, 415, nameWidth + 40, 2);

    ctx.fillStyle = '#475569';
    ctx.font = '18px Georgia, serif';
    ctx.fillText('has successfully completed the training course', W / 2, 470);

    ctx.fillStyle = '#1e3a5f';
    ctx.font = 'bold 28px Georgia, serif';
    ctx.fillText(courseTitle, W / 2, 520);

    ctx.fillStyle = '#475569';
    ctx.font = '16px Georgia, serif';
    const subLines = subtitle.includes('\n') ? subtitle.split('\n') : [subtitle];
    subLines.forEach((line, i) => ctx.fillText(line, W / 2, 570 + i * 25));

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(100, 650, W - 200, 3);

    ctx.fillStyle = '#64748b';
    ctx.font = '16px Georgia, serif';
    ctx.fillText(`Certification Date: ${date}`, W / 2, 700);

    ctx.font = '14px Georgia, serif';
    ctx.fillText(`Passed with 80% or higher on the ${quizDescription}`, W / 2, 730);

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(100, 780, W - 200, 3);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '48px serif';
    ctx.fillText('\u2605', W / 2, 850);

    ctx.fillStyle = '#1e3a5f';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText(badgeText, W / 2, 890);

    const corners = [
      [70, 70],
      [W - 70, 70],
      [70, H - 70],
      [W - 70, H - 70],
    ];
    ctx.fillStyle = '#3b82f6';
    for (const [x, y] of corners) {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}
