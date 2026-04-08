import cron from 'node-cron';
import { prisma } from '../lib/prisma';

// Campus Pulse: Weekly automated email to users with college-specific insights.
// Runs every Sunday at 6 PM.

export const startCampusPulseScheduler = () => {
  console.log('[Campus Pulse] Weekly email scheduler initialized.');

  // Schedule for every Sunday at 18:00 (6 PM)
  cron.schedule('0 18 * * 0', async () => {
    console.log('[Campus Pulse] Generating weekly reports...');

    try {
      const colleges = await prisma.college.findMany({
        include: { users: { where: { isEmailVerified: true } } }
      });

      for (const college of colleges) {
        if (college.users.length === 0) continue;

        // Gather insights for the last 7 days
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        const connectionCount = await prisma.matchSession.count({
          where: {
            startTime: { gte: lastWeek },
            OR: [
              { userA: { collegeId: college.id } },
              { userB: { collegeId: college.id } }
            ]
          }
        });

        const trendingConfessions = await prisma.confession.findMany({
          where: {
            collegeId: college.id,
            createdAt: { gte: lastWeek }
          },
          orderBy: { upvotes: 'desc' },
          take: 3
        });

        // In a real app, you would iterate through college.users and send emails
        console.log(`[Campus Pulse] Report for ${college.name}: ${connectionCount} connections, ${trendingConfessions.length} trending posts.`);
        
        // Mock sending email to first user for demo
        const firstUser = college.users[0];
        if (firstUser) {
           await sendPulseEmail(firstUser.email, {
             collegeName: college.name,
             connectionCount,
             trendingConfessions: trendingConfessions.map(c => c.content)
           });
        }
      }
    } catch (error) {
      console.error('[Campus Pulse] Error generating reports:', error);
    }
  });
};

const sendPulseEmail = async (email: string, data: any) => {
  // Use a service like Resend, SendGrid, or AWS SES
  console.log(`[Email] Sending Campus Pulse to ${email}:`, data);
};
