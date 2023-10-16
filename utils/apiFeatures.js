class APIFeatures {
  constructor(query, querySting) {
    this.query = query;
    this.querySting = querySting;
  }

  // 1C) Flitering ////////////////////////////
  filter() {
    const queryObj = { ...this.querySting };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach(el => delete queryObj[el])
    const queryString =
      JSON
        .stringify(queryObj)
        .replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    this.query = this.query.find(JSON.parse(queryString));
    return this;
  }

  // 1C) Sorting ////////////////////////////
  sort() {
    if (this.querySting.sort) {
      const sortBy = this.querySting.sort.split(',').join(' ');
      // const sortBy = this.querySting.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt _id');
    }
    return this;
  }

  // 1D) Field limiting ////////////////////////////
  limitFields() {
    if (this.querySting.fields) {
      const fields = this.querySting.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  // 1E) Pagination ////////////////////////////
  paginate() {
    const page = this.querySting.page * 1 || 1;
    const limit = this.querySting.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit)
    return this;
  }

}

module.exports = APIFeatures;