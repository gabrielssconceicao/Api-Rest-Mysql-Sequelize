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

  async findAll(supplierId) {
    try {
      const products = await this.repository.findAll(supplierId);
      return {
        body: products.map(({ id, name, price, stock }) => ({
          id,
          name,
          price,
          stock,
        })),
        status: 200,
      };
    } catch (error) {
      return {
        error: 'An error occurred while fetching products',
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
      const { id, name, price, stock } = await this.repository.create(body);
      return {
        body: { id, name, price, stock },
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
}

module.exports = ProductController;
