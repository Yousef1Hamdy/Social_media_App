"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create({ data, options, }) {
        return await this.model.create(data, options);
    }
    async createOne({ data, options, }) {
        const [doc] = (await this.create({ data: [data], options })) || [];
        return doc;
    }
    async findOne({ filter, projection, options, }) {
        const doc = this.model.findOne(filter, projection);
        if (options?.populate)
            doc.populate(options.populate);
        if (options?.lean)
            doc.lean(options.lean);
        return await doc.exec();
    }
    async find({ filter, projection, options, }) {
        const doc = this.model.find(filter, projection);
        if (options?.populate)
            doc.populate(options.populate);
        if (options?.skip)
            doc.skip(options.skip);
        if (options?.limit)
            doc.limit(options.limit);
        if (options?.lean)
            doc.lean(options.lean);
        return await doc.exec();
    }
    async paginate({ filter, projection, options = {}, page = undefined, size = 5, }) {
        let count = 0;
        if (Number(page) > 0) {
            page = parseInt(page);
            size = parseInt(size);
            options.skip = (page - 1) * size;
            options.limit = size;
            count = await this.model.countDocuments(filter);
        }
        const docs = await this.find({
            filter: filter || {},
            projection,
            options,
        });
        return {
            docs,
            currentPage: Number(page),
            pageSize: page ? Number(size) : undefined,
            pages: page ? Math.ceil(count / Number(size)) : undefined,
        };
    }
    async findById({ _id, projection, options, }) {
        const doc = this.model.findOne(_id, projection);
        if (options?.populate)
            doc.populate(options.populate);
        if (options?.lean)
            doc.lean(options.lean);
        return await doc.exec();
    }
    async findOneAndUpdate({ filter, update, options = { new: true }, }) {
        if (Array.isArray(update)) {
            update.push({ $set: { __v: { $add: ["$__v", 1] } } });
            return await this.model.findOneAndUpdate(filter, update, {
                ...options,
                updatePipeline: true,
            });
        }
        return await this.model.findOneAndUpdate(filter, { ...update, $inc: { __v: 1 } }, options);
    }
    async findByIdAndUpdate({ _id, update, options = { new: true }, }) {
        return this.model.findByIdAndUpdate(_id, { ...update, $inc: { __v: 1 } }, options);
    }
    async updateOne({ filter, update, options, }) {
        return await this.model.updateOne(filter, { ...update, $inc: { __v: 1 } }, options);
    }
    async updateMany({ filter, update, options, }) {
        return await this.model.updateMany(filter, { ...update, $inc: { __v: 1 } }, options);
    }
    async findOneAndDelete({ filter, }) {
        return await this.model.findOneAndDelete(filter);
    }
    async findByIdAndDelete({ _id, }) {
        return await this.model.findByIdAndDelete(_id);
    }
    async deleteOne({ filter, }) {
        return await this.model.deleteOne(filter);
    }
    async deleteMany({ filter, }) {
        return await this.model.deleteMany(filter);
    }
    async softDelete(filter) {
        return this.model.updateOne(filter, {
            deletedAt: new Date(),
        });
    }
    async hardDelete(filter) {
        return this.model.deleteOne({ ...filter, force: true });
    }
}
exports.BaseRepository = BaseRepository;
