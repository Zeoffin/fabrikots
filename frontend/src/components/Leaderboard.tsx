import React from 'react';
import { Grid } from '@mui/material';

interface LeaderboardProps {
    userPoints: { [username: string]: { points: number } };
}

interface LeaderboardEntry {
    username: string;
    points: number;
    rank: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ userPoints }) => {
    if (!userPoints) return null;

    // Convert userPoints to sorted leaderboard entries
    const leaderboardEntries: LeaderboardEntry[] = Object.entries(userPoints)
        .filter(([username]) => username !== 'markuss') // Exclude admin from leaderboard
        .map(([username, data]) => ({ username, points: data.points, rank: 0 }))
        .sort((a, b) => b.points - a.points) // Sort by points descending
        .map((entry, index) => ({ ...entry, rank: index + 1 })); // Add rank

    const getRankSuffix = (rank: number): string => {
        const lastDigit = rank % 10;
        const lastTwoDigits = rank % 100;
        
        if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
            return 'th';
        }
        
        switch (lastDigit) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };

    const getRankColor = (rank: number): string => {
        switch (rank) {
            case 1: return '#FFD700'; // Gold
            case 2: return '#C0C0C0'; // Silver
            case 3: return '#CD7F32'; // Bronze
            default: return 'rgba(0, 255, 170, 0.9)'; // Neon green
        }
    };

    const getRankEmoji = (rank: number): string => {
        switch (rank) {
            case 1: return '👑';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return '';
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '30rem',
            padding: '1rem'
        }}>
            {/*<h1 style={{*/}
            {/*    color: 'rgba(0, 255, 170, 0.9)',*/}
            {/*    fontSize: '2.5rem',*/}
            {/*    fontWeight: '700',*/}
            {/*    textAlign: 'center',*/}
            {/*    marginBottom: '1.5rem',*/}
            {/*    textShadow: '0 0 20px rgba(0, 255, 170, 0.5)',*/}
            {/*    textTransform: 'uppercase',*/}
            {/*    letterSpacing: '2px'*/}
            {/*}}>*/}
            {/*    Final Leaderboard 🏆*/}
            {/*</h1>*/}

            <div style={{
                width: '100%',
                maxWidth: '600px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '10px',
                border: '2px solid rgba(0, 255, 170, 0.3)',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}>
                <Grid container spacing={1}>
                    {leaderboardEntries.map((entry) => (
                        <Grid item xs={12} key={entry.username}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.75rem 1rem',
                                backgroundColor: entry.rank <= 3 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '8px',
                                border: entry.rank <= 3 ? `1px solid ${getRankColor(entry.rank)}` : '1px solid rgba(255, 255, 255, 0.1)',
                                marginBottom: '0.25rem',
                                transition: 'all 0.3s ease',
                                boxShadow: entry.rank <= 3 ? `0 0 10px ${getRankColor(entry.rank)}40` : 'none'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem'
                                }}>
                                    <div style={{
                                        fontSize: '1.2rem',
                                        fontWeight: '700',
                                        color: getRankColor(entry.rank),
                                        minWidth: '60px',
                                        textAlign: 'center',
                                        textShadow: entry.rank <= 3 ? `0 0 8px ${getRankColor(entry.rank)}` : 'none'
                                    }}>
                                        {entry.rank}{getRankSuffix(entry.rank)} {getRankEmoji(entry.rank)}
                                    </div>
                                    <div style={{
                                        fontSize: '1.1rem',
                                        fontWeight: '600',
                                        color: 'white',
                                        textTransform: 'capitalize'
                                    }}>
                                        {entry.username}
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: '1.3rem',
                                    fontWeight: '700',
                                    color: getRankColor(entry.rank),
                                    textShadow: entry.rank <= 3 ? `0 0 8px ${getRankColor(entry.rank)}` : 'none'
                                }}>
                                    {entry.points} pts
                                </div>
                            </div>
                        </Grid>
                    ))}
                </Grid>

                {/*{leaderboardEntries.length > 0 && (*/}
                {/*    <div style={{*/}
                {/*        textAlign: 'center',*/}
                {/*        marginTop: '1.5rem',*/}
                {/*        padding: '1rem',*/}
                {/*        borderTop: '1px solid rgba(0, 255, 170, 0.3)'*/}
                {/*    }}>*/}
                {/*        <h2 style={{*/}
                {/*            color: 'rgba(0, 255, 170, 0.9)',*/}
                {/*            fontSize: '1.3rem',*/}
                {/*            fontWeight: '600',*/}
                {/*            marginBottom: '0.5rem',*/}
                {/*            textShadow: '0 0 10px rgba(0, 255, 170, 0.4)'*/}
                {/*        }}>*/}
                {/*            Congratulations! 🎉*/}
                {/*        </h2>*/}
                {/*        <p style={{*/}
                {/*            color: 'rgba(255, 255, 255, 0.8)',*/}
                {/*            fontSize: '1rem',*/}
                {/*            margin: '0'*/}
                {/*        }}>*/}
                {/*            Thank you for playing FABRIKOTS!*/}
                {/*        </p>*/}
                {/*    </div>*/}
                {/*)}*/}
            </div>
        </div>
    );
};

export default Leaderboard;