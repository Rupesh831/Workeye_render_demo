import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Award, Star } from 'lucide-react';

interface Performer {
  id: string;
  name: string;
  productivity: number;
  activeHours: number;
  tasksCompleted: number;
  rank: number;
}

interface TopPerformersCardProps {
  performers: Performer[];
  period?: string;
}

export const TopPerformersCard = ({
  performers,
  period = 'This Week',
}: TopPerformersCardProps) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Award className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-400" />;
      default:
        return <Star className="w-5 h-5 text-gray-300" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-orange-500';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-orange-300 to-orange-500';
      default:
        return 'from-blue-400 to-purple-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-xl p-6 shadow-md"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Top Performers</h3>
          <p className="text-sm text-gray-600">{period}</p>
        </div>
        <TrendingUp className="w-6 h-6 text-green-600" />
      </div>

      <div className="space-y-4">
        {performers.map((performer, index) => (
          <motion.div
            key={performer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, x: 5 }}
            className="relative"
          >
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
              {/* Rank Badge */}
              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRankColor(
                    performer.rank
                  )} flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                >
                  {performer.rank}
                </div>
                <div className="absolute -top-1 -right-1">
                  {getRankIcon(performer.rank)}
                </div>
              </div>

              {/* Performer Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">{performer.name}</p>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-bold text-green-600">
                      {performer.productivity}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{performer.activeHours}h</span>
                    <span>active</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{performer.tasksCompleted}</span>
                    <span>tasks</span>
                  </div>
                </div>

                {/* Productivity Bar */}
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${performer.productivity}%` }}
                    transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                    className="h-full bg-gradient-to-r from-green-400 to-green-600"
                  />
                </div>
              </div>
            </div>

            {/* Rank Highlight for Top 3 */}
            {performer.rank <= 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.5 }}
                className="absolute inset-0 bg-gradient-to-r from-yellow-100/50 to-transparent rounded-lg -z-10 blur-sm"
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* View All Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
      >
        View All Performers
      </motion.button>
    </motion.div>
  );
};