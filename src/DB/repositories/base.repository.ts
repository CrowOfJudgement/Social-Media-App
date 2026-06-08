import { HydratedDocument, Model, QueryFilter, UpdateQuery } from 'mongoose'

class BaseRepository<TDocument> {
  constructor(protected readonly model: Model<TDocument>) {}

  async create(data: Partial<TDocument>): Promise<HydratedDocument<TDocument>> {
    return this.model.create(data)
  }

  async findById(id: string): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findById(id).exec()
  }

  async findOne({ filter, projection, options }:
     { filter: QueryFilter<TDocument>, projection?: any ,options?: any }): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findOne(filter, projection).sort(options).exec()
  }

  async findOneAndUpdate({ filter, update, options }:
     { filter: QueryFilter<TDocument>, update: UpdateQuery<TDocument>, options?: any }): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findOneAndUpdate(filter, update, options).exec() as unknown as Promise<HydratedDocument<TDocument> | null>
  }

  async find({ filter, projection, options }:
     { filter: QueryFilter<TDocument>, projection?: any ,options?: any }): Promise<HydratedDocument<TDocument>[]> {
    return this.model.find(filter, projection).sort(options).exec()
  }

  async paginate({
    page,
    limit,
    sort,
    populate,
    search,
  }: {
    page?: number
    limit?: number
    sort?: any
    populate?: any
    search?: QueryFilter<TDocument>
  }) {
    page = +page! || 1
    limit = +limit! || 2

    if (page < 1) page = 1
    if (limit < 1) limit = 2

    const skip = (page - 1) * limit

    const [data, totalDoc] = await Promise.all([
      this.model.find({ ...(search ?? {}) })
      .skip(skip)
      .limit(limit)
      .populate(populate).sort(sort),
      this.model.countDocuments({ ...(search ?? {}) }),
    ])

    const totalPages = Math.ceil(totalDoc / limit)

    return {
      meta: {
        currentPage: page,
        totalPages,
        limit,
        totalDoc,
      },
      data,
    }
  }

  async update(id: string, data: Partial<TDocument>): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec()
  }

  async delete(id: string): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findByIdAndDelete(id).exec()
  }
}

export default BaseRepository
