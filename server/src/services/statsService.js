const dayjs = require('dayjs');
const isBetween = require('dayjs/plugin/isBetween');
dayjs.extend(isBetween);

const Work = require('../models/Work');
const Note = require('../models/Note');
const Tag = require('../models/Tag');
const { CHINESE_COLORS } = require('../data/constants');

class StatsService {
  async getOverview(userId) {
    const startOfYear = dayjs().startOf('year').toDate();
    const now = new Date();

    const [totalWorks, totalNotes, works, notes] = await Promise.all([
      Work.countDocuments({ userId }),
      Note.countDocuments({ userId }),
      Work.find({ userId }),
      Note.find({ userId }),
    ]);

    const byType = { tv: 0, book: 0, movie: 0 };
    const byStatus = { wish: 0, watching: 0, watched: 0 };
    let watchedThisYear = 0;
    let watchingNow = 0;
    let totalEpisodes = 0;
    let totalPages = 0;

    works.forEach((w) => {
      byType[w.type] = (byType[w.type] || 0) + 1;
      byStatus[w.status] = (byStatus[w.status] || 0) + 1;
      if (w.status === 'watched' && w.finishedAt && w.finishedAt >= startOfYear) {
        watchedThisYear++;
      }
      if (w.status === 'watching') watchingNow++;
      totalEpisodes += w.currentEpisode || 0;
      totalPages += w.currentPage || 0;
    });

    const moodMap = {};
    notes.forEach((n) => {
      if (n.moodColor) {
        moodMap[n.moodColor] = (moodMap[n.moodColor] || 0) + 1;
      }
    });
    works.forEach((w) => {
      if (w.moodColor) {
        moodMap[w.moodColor] = (moodMap[w.moodColor] || 0) + 1;
      }
    });

    const moodDistribution = Object.entries(moodMap)
      .map(([color, count]) => {
        const colorMeta = CHINESE_COLORS.find((c) => c.hex === color);
        return {
          color,
          name: colorMeta ? colorMeta.name : color,
          count,
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      totalWorks,
      totalNotes,
      watchedThisYear,
      watchingNow,
      byType,
      byStatus,
      moodDistribution,
      totalEpisodes,
      totalPages,
      generatedAt: now,
    };
  }

  async getWeeklyHeatmap(userId, weeks = 52) {
    const now = dayjs();
    const endDate = now.endOf('week');
    const startDate = endDate.subtract(weeks - 1, 'week').startOf('week');

    const [works, notes] = await Promise.all([
      Work.find({ userId, updatedAt: { $gte: startDate.toDate() } }),
      Note.find({ userId, createdAt: { $gte: startDate.toDate() } }),
    ]);

    const dailyActivity = {};
    works.forEach((w) => {
      const date = dayjs(w.updatedAt).format('YYYY-MM-DD');
      dailyActivity[date] = (dailyActivity[date] || 0) + 1;
    });
    notes.forEach((n) => {
      const date = dayjs(n.createdAt).format('YYYY-MM-DD');
      dailyActivity[date] = (dailyActivity[date] || 0) + 2;
    });

    let maxActivity = 0;
    const weeksArr = [];

    for (let i = 0; i < weeks; i++) {
      const weekStart = startDate.add(i, 'week');
      const days = [];
      for (let d = 0; d < 7; d++) {
        const date = weekStart.add(d, 'day');
        const dateStr = date.format('YYYY-MM-DD');
        const count = dailyActivity[dateStr] || 0;
        if (count > maxActivity) maxActivity = count;
        days.push({ date: dateStr, activityCount: count });
      }
      weeksArr.push({
        weekStart: weekStart.format('YYYY-MM-DD'),
        days,
      });
    }

    return { weeks: weeksArr, maxActivity };
  }

  async getMonthlyStats(userId, year) {
    const targetYear = year || dayjs().year();
    const startOfYear = dayjs(`${targetYear}-01-01`).startOf('year');
    const endOfYear = startOfYear.endOf('year');

    const [works, notes] = await Promise.all([
      Work.find({
        userId,
        finishedAt: { $gte: startOfYear.toDate(), $lte: endOfYear.toDate() },
      }),
      Note.find({
        userId,
        createdAt: { $gte: startOfYear.toDate(), $lte: endOfYear.toDate() },
      }),
    ]);

    const months = [];
    for (let m = 1; m <= 12; m++) {
      const monthStart = dayjs(`${targetYear}-${String(m).padStart(2, '0')}-01`);
      const monthEnd = monthStart.endOf('month');

      const monthWorks = works.filter((w) => dayjs(w.finishedAt).isBetween(monthStart, monthEnd, null, '[]'));
      const monthNotes = notes.filter((n) => dayjs(n.createdAt).isBetween(monthStart, monthEnd, null, '[]'));

      const moodMap = {};
      monthWorks.forEach((w) => w.moodColor && (moodMap[w.moodColor] = (moodMap[w.moodColor] || 0) + 1));
      monthNotes.forEach((n) => n.moodColor && (moodMap[n.moodColor] = (moodMap[n.moodColor] || 0) + 1));

      const topMood = Object.entries(moodMap).sort((a, b) => b[1] - a[1])[0];
      const avgRating = monthWorks.filter((w) => w.rating > 0).length
        ? monthWorks.filter((w) => w.rating > 0).reduce((s, w) => s + w.rating, 0) /
          monthWorks.filter((w) => w.rating > 0).length
        : 0;

      months.push({
        month: m,
        worksCompleted: monthWorks.length,
        notesCount: monthNotes.length,
        avgRating: Math.round(avgRating * 10) / 10,
        topMood: topMood ? topMood[0] : null,
      });
    }

    return { year: targetYear, months };
  }

  async getAnnualReport(userId, year) {
    const targetYear = year || dayjs().year();
    const startOfYear = dayjs(`${targetYear}-01-01`).startOf('year');
    const endOfYear = startOfYear.endOf('year');

    const [works, notes, tags] = await Promise.all([
      Work.find({ userId, createdAt: { $gte: startOfYear.toDate(), $lte: endOfYear.toDate() } }),
      Note.find({ userId, createdAt: { $gte: startOfYear.toDate(), $lte: endOfYear.toDate() } }).sort({
        createdAt: 1,
      }),
      Tag.find({ userId }),
    ]);

    const completedWorks = works.filter((w) => w.status === 'watched');
    const totalEpisodesWatched = works.reduce((s, w) => s + (w.currentEpisode || 0), 0);
    const totalPagesRead = works.reduce((s, w) => s + (w.currentPage || 0), 0);

    const topRated = [...completedWorks].sort((a, b) => b.rating - a.rating).slice(0, 5);
    const worksWithNoteCount = [...works].sort((a, b) => b.noteCount - a.noteCount);
    const mostNotes = worksWithNoteCount.slice(0, 5);

    const monthlyBreakdown = (await this.getMonthlyStats(userId, targetYear)).months;

    const moodTimeline = [];
    notes.forEach((n) => {
      if (n.moodColor) {
        moodTimeline.push({
          date: n.createdAt,
          color: n.moodColor,
          noteId: n._id,
          workId: n.workId,
        });
      }
    });
    works.forEach((w) => {
      if (w.moodColor) {
        moodTimeline.push({
          date: w.updatedAt,
          color: w.moodColor,
          workId: w._id,
        });
      }
    });
    moodTimeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    const tagWorksCount = {};
    works.forEach((w) => w.tags.forEach((t) => (tagWorksCount[t] = (tagWorksCount[t] || 0) + 1)));
    const tagsCloud = tags
      .map((t) => ({
        tagId: t._id,
        tagName: t.name,
        count: tagWorksCount[t._id.toString()] || 0,
      }))
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const milestones = [];
    const sortedWorks = [...works].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortedWorks[0]) {
      milestones.push({
        date: sortedWorks[0].createdAt,
        type: 'first_work',
        text: `今年第一件作品：《${sortedWorks[0].title}》`,
      });
    }
    if (completedWorks[0]) {
      milestones.push({
        date: completedWorks[0].finishedAt,
        type: 'first_complete',
        text: `完成第一部：《${completedWorks[0].title}》`,
      });
    }
    if (notes[0]) {
      milestones.push({
        date: notes[0].createdAt,
        type: 'first_note',
        text: '写下第一段笔记',
      });
    }
    milestones.sort((a, b) => new Date(a.date) - new Date(b.date));

    const wordFreq = {};
    notes.forEach((n) => {
      const words = n.content.replace(/[，。、；：「」『』（）《》\s\p{P}]/gu, ' ').split(/\s+/);
      words.forEach((w) => {
        if (w.length >= 2) wordFreq[w] = (wordFreq[w] || 0) + 1;
      });
    });
    const wordCloud = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([w]) => w);

    return {
      year: targetYear,
      summary: {
        worksAdded: works.length,
        worksCompleted: completedWorks.length,
        totalNotes: notes.length,
        totalEpisodesWatched,
        totalPagesRead,
      },
      topRated,
      mostNotes,
      monthlyBreakdown,
      moodTimeline,
      tagsCloud,
      wordCloud,
      milestones,
    };
  }

  async getTasteGraph(userId) {
    const works = await Work.find({ userId }).lean();

    const directorCount = {};
    const actorCount = {};
    const authorCount = {};
    const genreCount = {};
    const writerCount = {};
    const typeCount = { tv: 0, book: 0, movie: 0 };
    const workMap = {};
    const collabLinks = [];

    works.forEach((work) => {
      workMap[work._id.toString()] = work;
      typeCount[work.type] = (typeCount[work.type] || 0) + 1;

      const workId = work._id.toString();

      if (work.author) {
        const names = work.author.split(/[,，、;；\/]/).map((s) => s.trim()).filter(Boolean);
        names.forEach((n) => {
          if (!authorCount[n]) authorCount[n] = { count: 0, works: [], avgRating: 0, totalRating: 0 };
          authorCount[n].count++;
          authorCount[n].works.push(workId);
          if (work.rating > 0) {
            authorCount[n].totalRating += work.rating;
          }
        });
      }

      (work.directors || []).forEach((n) => {
        const name = n.trim();
        if (!name) return;
        if (!directorCount[name]) directorCount[name] = { count: 0, works: [], avgRating: 0, totalRating: 0 };
        directorCount[name].count++;
        directorCount[name].works.push(workId);
        if (work.rating > 0) {
          directorCount[name].totalRating += work.rating;
        }
      });

      (work.actors || []).forEach((n) => {
        const name = n.trim();
        if (!name) return;
        if (!actorCount[name]) actorCount[name] = { count: 0, works: [], avgRating: 0, totalRating: 0 };
        actorCount[name].count++;
        actorCount[name].works.push(workId);
        if (work.rating > 0) {
          actorCount[name].totalRating += work.rating;
        }
      });

      (work.genres || []).forEach((g) => {
        const name = g.trim();
        if (!name) return;
        if (!genreCount[name]) genreCount[name] = { count: 0, works: [], avgRating: 0, totalRating: 0 };
        genreCount[name].count++;
        genreCount[name].works.push(workId);
        if (work.rating > 0) {
          genreCount[name].totalRating += work.rating;
        }
      });

      (work.writers || []).forEach((n) => {
        const name = n.trim();
        if (!name) return;
        if (!writerCount[name]) writerCount[name] = { count: 0, works: [], avgRating: 0, totalRating: 0 };
        writerCount[name].count++;
        writerCount[name].works.push(workId);
        if (work.rating > 0) {
          writerCount[name].totalRating += work.rating;
        }
      });

      const allPeople = [
        ...(work.directors || []),
        ...(work.actors || []),
        ...(work.writers || []),
        ...(work.author ? work.author.split(/[,，、;；\/]/) : []),
      ].map((s) => s.trim()).filter(Boolean);

      for (let i = 0; i < allPeople.length; i++) {
        for (let j = i + 1; j < allPeople.length; j++) {
          const a = allPeople[i];
          const b = allPeople[j];
          if (a === b) continue;
          const key = [a, b].sort().join('↔');
          const existing = collabLinks.find((l) => l.key === key);
          if (existing) {
            existing.count++;
            existing.works.push(workId);
          } else {
            collabLinks.push({ key, source: a, target: b, count: 1, works: [workId] });
          }
        }
      }
    });

    const calcAvg = (obj) => {
      for (const k of Object.keys(obj)) {
        const entry = obj[k];
        entry.avgRating = entry.totalRating > 0 && entry.count > 0
          ? Math.round((entry.totalRating / entry.count) * 10) / 10
          : 0;
        delete entry.totalRating;
      }
    };
    calcAvg(directorCount);
    calcAvg(actorCount);
    calcAvg(authorCount);
    calcAvg(genreCount);
    calcAvg(writerCount);

    const topDirectors = Object.entries(directorCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([name, data]) => ({ name, ...data }));

    const topActors = Object.entries(actorCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 30)
      .map(([name, data]) => ({ name, ...data }));

    const topAuthors = Object.entries(authorCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([name, data]) => ({ name, ...data }));

    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([name, data]) => ({ name, ...data }));

    const topWriters = Object.entries(writerCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([name, data]) => ({ name, ...data }));

    const topCollabs = collabLinks
      .sort((a, b) => b.count - a.count)
      .slice(0, 50)
      .map(({ key, source, target, count, works }) => ({ source, target, count, works }));

    const nodes = [];
    const seenNodes = new Set();

    const addNode = (name, category, data) => {
      if (seenNodes.has(name)) return;
      seenNodes.add(name);
      nodes.push({
        id: name,
        name,
        category,
        count: data.count,
        avgRating: data.avgRating,
        works: data.works,
      });
    };

    topDirectors.forEach((d) => addNode(d.name, 'director', d));
    topActors.forEach((a) => addNode(a.name, 'actor', a));
    topAuthors.forEach((a) => addNode(a.name, 'author', a));
    topWriters.forEach((w) => addNode(w.name, 'writer', w));
    topGenres.forEach((g) => addNode(g.name, 'genre', g));

    const links = topCollabs
      .filter((l) => seenNodes.has(l.source) && seenNodes.has(l.target))
      .map(({ source, target, count, works }) => ({ source, target, value: count, works }));

    return {
      totalWorks: works.length,
      typeCount,
      topDirectors,
      topActors,
      topAuthors,
      topGenres,
      topWriters,
      network: {
        nodes,
        links,
      },
      works: workMap,
      generatedAt: new Date(),
    };
  }
}

module.exports = new StatsService();
