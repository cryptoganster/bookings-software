import { TypeOrmUnitOfWork } from '../uow';
import { DataSource } from 'typeorm';

describe('TypeOrmUnitOfWork', () => {
  let dataSource: DataSource;
  let uow: TypeOrmUnitOfWork;
  let mockQueryRunner: any;

  beforeEach(() => {
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    };

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as any;

    uow = new TypeOrmUnitOfWork(dataSource);
  });

  describe('transaction', () => {
    it('should execute work function within transaction', async () => {
      const workFn = jest.fn().mockResolvedValue('result');

      const result = await uow.transaction(workFn);

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(workFn).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result).toBe('result');
    });

    it('should rollback transaction on error', async () => {
      const error = new Error('Test error');
      const workFn = jest.fn().mockRejectedValue(error);

      await expect(uow.transaction(workFn)).rejects.toThrow('Test error');

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(workFn).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('should release query runner even if commit fails', async () => {
      const workFn = jest.fn().mockResolvedValue('result');
      mockQueryRunner.commitTransaction.mockRejectedValue(new Error('Commit failed'));

      await expect(uow.transaction(workFn)).rejects.toThrow('Commit failed');

      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should pass isolation level to startTransaction', async () => {
      const workFn = jest.fn().mockResolvedValue('result');
      const options = { isolationLevel: 'SERIALIZABLE' as const };

      await uow.transaction(workFn, options);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalledWith('SERIALIZABLE');
    });

    it('should start transaction without isolation level if not provided', async () => {
      const workFn = jest.fn().mockResolvedValue('result');

      await uow.transaction(workFn);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getQueryRunner', () => {
    it('should return a new query runner', () => {
      const queryRunner = uow.getQueryRunner();

      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(queryRunner).toBe(mockQueryRunner);
    });
  });
});
