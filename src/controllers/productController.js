const ProductRepository = require('../repositories/ProductRepository');
class ProductController {
  repository = new ProductRepository();

  validateProduct(product) {
    const errors = [];

    if (!product.name || product.name.length < 3 || product.name.length > 255) {
      errors.push('Product name must be between 3 and 255 characters');
    }

    if (product.stock < 0 || !Number.isInteger(product.stock)) {
      errors.push('Stock must be a positive integer number');
    }

    if (product.price < 0 || typeof product.price !== 'number') {
      errors.push('Price must be a positive float number');
    }

    return errors;
  }

  validateUpdateProduct(product) {
    const errors = [];
    const fields = ['name', 'price', 'stock'];
    const fieldsToUpdate = {};
    fields.forEach((field) => {
      if (product[field]) {
        fieldsToUpdate[field] = product[field];
      }
    });

    return fieldsToUpdate;
  }

  deserializeProduct(product) {
    const { id, name, price, stock } = product;
    return { id, name, price, stock };
  }

  async findAll(supplierId) {
    try {
      const products = await this.repository.findAll(supplierId);
      return {
        body: products.map((product) => this.deserializeProduct(product)),
        status: 200,
      };
    } catch (error) {
      return {
        error: 'An error occurred while fetching products',
        status: 500,
      };
    }
  }

  async findOne(supplierId, productId) {
    try {
      const result = await this.repository.findOne(supplierId, productId);
      if (!result) {
        return {
          body: { error: 'Product not found' },
          status: 404,
        };
      }
      return {
        body: this.deserializeProduct(result),
        status: 200,
      };
    } catch (error) {
      return {
        body: {
          error: 'An error occurred while fetching product',
        },
        status: 500,
      };
    }
  }

  async create(body) {
    try {
      const errors = this.validateProduct(body);

      if (errors.length) {
        return {
          body: {
            error: errors,
          },
          status: 400,
        };
      }
      const product = await this.repository.create(body);
      return {
        body: this.deserializeProduct(product),
        status: 201,
      };
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map((err) => err.message);
        return {
          body: {
            error: messages,
          },
          status: 400,
        };
      }
      return {
        body: {
          error: 'An error occurred while creating product',
        },
        status: 500,
      };
    }
  }

  async update(body) {
    try {
      const { id, supplierId, ...data } = body;
      const fieldsToUpdate = this.validateUpdateProduct(data);
      if (Object.keys(fieldsToUpdate).length === 0) {
        return {
          body: {
            error: 'No fields to update',
          },
          status: 400,
        };
      }

      await this.repository.update({ id, supplierId, fieldsToUpdate });
      return {
        body: null,
        status: 204,
      };
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map((err) => err.message);
        return {
          body: {
            error: messages,
          },
          status: 400,
        };
      }
      console.log(error);
      return {
        body: {
          error: 'An error occurred while updating product',
        },
        status: 500,
      };
    }
  }

  async delete(body) {
    try {
      await this.repository.delete(body);
      return {
        body: null,
        status: 204,
      };
    } catch (error) {
      return {
        body: {
          error: 'An error occurred while deleting product',
        },
        status: 500,
      };
    }
  }

  async reduceStock(body) {
    try {
      const { id, supplierId, ...data } = body;
      const product = await this.repository.findOne(supplierId, id);
      const { stock } = product;
      if (stock < data.quantity || data.quantity < 0) {
        return {
          body: {
            error: 'Stock is not enough',
          },
          status: 400,
        };
      }
      const newStock = stock - data.quantity;
      await this.repository.reduceStock({ id, supplierId, stock: newStock });
      return {
        body: null,
        status: 204,
      };
    } catch (error) {
      return {
        body: {
          error: 'An error occurred while reducing stock',
        },
        status: 500,
      };
    }
  }
}

module.exports = ProductController;
