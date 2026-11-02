import SystemNotice from '../../models/SystemNotice.js';
import SystemNoticeRead from '../../models/SystemNoticeRead.js';
import { ApiError } from '../../utils/ApiError.js';
export class NoticeController {
    // ─── Super Admin Endpoints ──────────────────────────────────────────
    // 1. Get all notices with read statistics
    static async getAll(req, res) {
        const notices = await SystemNotice.find().sort({ pinned: -1, createdAt: -1 });
        // Aggregate reads count per notice
        const reads = await SystemNoticeRead.aggregate([
            {
                $group: {
                    _id: '$notice_id',
                    count: { $sum: 1 },
                },
            },
        ]);
        const readCountMap = new Map(reads.map((r) => [r._id.toString(), r.count]));
        const items = notices.map((n) => ({
            ...n.toObject(),
            read_count: readCountMap.get(n._id.toString()) || 0,
        }));
        res.json({
            success: true,
            data: items,
        });
    }
    // 2. Create a new notice
    static async create(req, res) {
        const data = req.body;
        const durationDays = Number(data.banner_duration_days) || 7;
        const bannerExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
        const notice = await SystemNotice.create({
            title: data.title?.trim(),
            content: data.content?.trim(),
            type: data.type || 'ANNOUNCEMENT',
            badge_text: data.badge_text?.trim() || null,
            pinned: Boolean(data.pinned),
            is_published: data.is_published !== undefined ? Boolean(data.is_published) : true,
            show_banner: data.show_banner !== undefined ? Boolean(data.show_banner) : true,
            banner_duration_days: durationDays,
            banner_expires_at: bannerExpiresAt,
            target_type: data.target_type || 'ALL',
            target_business_ids: data.target_type === 'SPECIFIC' ? (data.target_business_ids || []) : [],
        });
        res.status(201).json({ success: true, data: notice });
    }
    // 3. Update notice
    static async update(req, res) {
        const { id } = req.params;
        const data = req.body;
        if (data.banner_duration_days) {
            const days = Number(data.banner_duration_days);
            data.banner_expires_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        }
        const notice = await SystemNotice.findByIdAndUpdate(id, data, { new: true });
        if (!notice)
            throw ApiError.notFound('Notice not found');
        res.json({ success: true, data: notice });
    }
    // 4. Delete notice
    static async delete(req, res) {
        const { id } = req.params;
        const notice = await SystemNotice.findByIdAndDelete(id);
        if (!notice)
            throw ApiError.notFound('Notice not found');
        // Also remove associated reads
        await SystemNoticeRead.deleteMany({ notice_id: id });
        res.json({ success: true, message: 'Notice deleted successfully' });
    }
    // 5. Toggle status (published/pinned)
    static async toggleField(req, res) {
        const { id } = req.params;
        const { field } = req.body; // 'pinned' or 'is_published'
        if (!['pinned', 'is_published'].includes(field)) {
            throw ApiError.badRequest('Invalid field to toggle');
        }
        const notice = await SystemNotice.findById(id);
        if (!notice)
            throw ApiError.notFound('Notice not found');
        notice[field] = !notice[field];
        await notice.save();
        res.json({ success: true, data: notice });
    }
    // ─── Tenant / Restaurant Owner Endpoints ─────────────────────────────
    // 6. Get notices for restaurant tenant (with unread count & active banners)
    static async getTenantNotices(req, res) {
        const tenantId = req.user?.restaurant_id;
        if (!tenantId) {
            throw ApiError.badRequest('No active restaurant context found');
        }
        const allPublished = await SystemNotice.find({ is_published: true }).sort({
            pinned: -1,
            createdAt: -1,
        });
        // Filter by targeting: ALL or specific tenantId included
        const targeted = allPublished.filter((n) => {
            if (n.target_type === 'ALL')
                return true;
            if (Array.isArray(n.target_business_ids)) {
                return n.target_business_ids.includes(tenantId.toString());
            }
            return false;
        });
        const noticeIds = targeted.map((n) => n._id);
        const reads = await SystemNoticeRead.find({
            notice_id: { $in: noticeIds },
            business_id: tenantId.toString(),
        });
        const readMap = new Map(reads.map((r) => [r.notice_id.toString(), r.read_at]));
        const notices = targeted.map((n) => {
            const idStr = n._id.toString();
            const isRead = readMap.has(idStr);
            return {
                ...n.toObject(),
                is_read: isRead,
                read_at: readMap.get(idStr) || null,
            };
        });
        // Active banners that have not expired
        const now = new Date();
        const bannerNotices = targeted
            .filter((n) => n.show_banner && (!n.banner_expires_at || new Date(n.banner_expires_at) > now))
            .map((n) => ({
            id: n._id.toString(),
            title: n.title,
            content: n.content,
            type: n.type,
            badge_text: n.badge_text,
            is_read: readMap.has(n._id.toString()),
        }));
        const unreadCount = notices.filter((n) => !n.is_read).length;
        res.json({
            success: true,
            data: {
                notices,
                banner_notices: bannerNotices,
                unread_count: unreadCount,
            },
        });
    }
    // 7. Mark a single notice as read
    static async markNoticeRead(req, res) {
        const { id } = req.params;
        const tenantId = req.user?.restaurant_id;
        const userId = req.user?._id;
        if (!tenantId) {
            throw ApiError.badRequest('No active restaurant context found');
        }
        const read = await SystemNoticeRead.findOneAndUpdate({ notice_id: id, business_id: tenantId.toString() }, {
            notice_id: id,
            business_id: tenantId.toString(),
            user_id: userId,
            read_at: new Date(),
        }, { upsert: true, new: true });
        res.json({ success: true, data: read });
    }
    // 8. Mark all notices as read for this restaurant
    static async markAllRead(req, res) {
        const tenantId = req.user?.restaurant_id;
        const userId = req.user?._id;
        if (!tenantId) {
            throw ApiError.badRequest('No active restaurant context found');
        }
        const allPublished = await SystemNotice.find({ is_published: true });
        const targeted = allPublished.filter((n) => {
            if (n.target_type === 'ALL')
                return true;
            return Array.isArray(n.target_business_ids) && n.target_business_ids.includes(tenantId.toString());
        });
        const now = new Date();
        const ops = targeted.map((n) => ({
            updateOne: {
                filter: { notice_id: n._id, business_id: tenantId.toString() },
                update: {
                    $set: {
                        notice_id: n._id,
                        business_id: tenantId.toString(),
                        user_id: userId,
                        read_at: now,
                    },
                },
                upsert: true,
            },
        }));
        if (ops.length > 0) {
            await SystemNoticeRead.bulkWrite(ops);
        }
        res.json({ success: true, message: 'All notices marked as read' });
    }
}
//# sourceMappingURL=notice.controller.js.map