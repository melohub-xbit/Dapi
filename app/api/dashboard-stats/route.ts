
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json({ message: 'userEmail is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const userScenariosCollection = db.collection(COLLECTIONS.USER_SCENARIOS);

    const userScenarios = await userScenariosCollection.aggregate([
      { $match: { userEmail: userEmail } },
      {
        $lookup: {
          from: COLLECTIONS.SCENARIOS,
          localField: 'scenarioId',
          foreignField: 'id',
          as: 'scenarioDetails'
        }
      },
      { $unwind: '$scenarioDetails' }
    ]).toArray();

    let totalWords = 0;
    let totalSentences = 0;
    let totalGamesWon = 0;
    let totalScore = 0;

    for (const userScenario of userScenarios) {
      if (userScenario.scenarioDetails && userScenario.scenarioDetails.sentences) {
        totalSentences += userScenario.scenarioDetails.sentences.length;
        userScenario.scenarioDetails.sentences.forEach((sentence: any) => {
          totalWords += sentence.sentence.split(' ').length;
        });
      }
      totalGamesWon += userScenario.gamesWon || 0;
      totalScore += userScenario.totalScore || 0;
    }

    const stats = {
      gamesWon: totalGamesWon,
      scenarios: userScenarios.length,
      totalScore,
      dayStreak: 12, // Placeholder for now
      totalWords,
      totalSentences,
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
