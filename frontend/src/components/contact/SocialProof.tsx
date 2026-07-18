'use client';

import { motion } from 'framer-motion';
import { Code2, Users, Star, TrendingUp, Quote, ThumbsUp } from 'lucide-react';

interface StatItem {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}

const stats: StatItem[] = [
  {
    icon: <Code2 className="w-6 h-6" />,
    value: '50+',
    label: '开源项目',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: <Users className="w-6 h-6" />,
    value: '1000+',
    label: '合作客户',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: <Star className="w-6 h-6" />,
    value: '4.9',
    label: '平均评分',
    color: 'from-pink-500 to-pink-600',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    value: '5年',
    label: '行业经验',
    color: 'from-orange-500 to-orange-600',
  },
];

interface Testimonial {
  name: string;
  role: string;
  content: string;
  avatar: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: '张伟',
    role: '产品经理',
    content: '专业、高效、响应迅速。在整个项目合作过程中，展现了出色的技术能力和沟通技巧。',
    avatar: 'ZW',
    rating: 5,
  },
  {
    name: '李娜',
    role: '技术总监',
    content: '对技术有深入理解，能快速理解需求并给出最优解决方案。强烈推荐！',
    avatar: 'LN',
    rating: 5,
  },
  {
    name: '王明',
    role: '创业者',
    content: '从项目设计到上线，整个过程非常顺利。代码质量高，易于维护。',
    avatar: 'WM',
    rating: 5,
  },
];

function StatCard({ stat, delay }: { stat: StatItem; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white/50 dark:bg-black/50 backdrop-blur-xl rounded-xl p-6 border border-gray-200 dark:border-gray-800 group hover:shadow-xl transition-all duration-300"
    >
      <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
        {stat.icon}
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        {stat.value}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {stat.label}
      </div>
    </motion.div>
  );
}

function TestimonialCard({ testimonial, delay }: { testimonial: Testimonial; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white/50 dark:bg-black/50 backdrop-blur-xl rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
          {testimonial.avatar}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {testimonial.name}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {testimonial.role}
          </p>
        </div>
        <div className="flex gap-0.5">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          ))}
        </div>
      </div>
      <div className="relative">
        <Quote className="absolute -top-2 -left-1 w-6 h-6 text-gray-300 dark:text-gray-700" />
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed pl-6">
          {testimonial.content}
        </p>
      </div>
      <div className="flex items-center gap-1 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <ThumbsUp className="w-4 h-4 text-green-500" />
        <span className="text-sm text-gray-600 dark:text-gray-400">推荐合作</span>
      </div>
    </motion.div>
  );
}

export default function SocialProof() {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 px-1">
        关于我
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, index) => (
          <StatCard key={stat.label} stat={stat} delay={index * 0.1} />
        ))}
      </div>

      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        合作伙伴评价
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <TestimonialCard key={`${testimonial.name}-${testimonial.role}`} testimonial={testimonial} delay={0.4 + index * 0.1} />
        ))}
      </div>
    </section>
  );
}
