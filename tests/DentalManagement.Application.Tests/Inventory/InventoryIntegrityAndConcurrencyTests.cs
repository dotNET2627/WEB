using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Inventory.Audits;
using DentalManagement.Application.Inventory.Batches.ConsumeStockFefo;
using DentalManagement.Application.Prescriptions.DispensePrescription;
using DentalManagement.Domain.Inventory;
using DentalManagement.Domain.Prescriptions;
using Xunit;

namespace DentalManagement.Application.Tests.Inventory;

public sealed class InventoryIntegrityAndConcurrencyTests
{
    [Fact]
    public async Task ConsumeStockFefo_ConsumesEarliestNonExpiredBatchFirst()
    {
        var clock = new FixedClock(new DateTimeOffset(2026, 11, 1, 0, 0, 0, TimeSpan.Zero));
        var clinicId = Guid.NewGuid();
        var itemId = Guid.NewGuid();

        var expiredBatch = new InventoryBatch(Guid.NewGuid(), clinicId, itemId, "LOT-EXP", new DateOnly(2026, 10, 15), 10, 1000m, clock.UtcNow);
        var soonerBatch = new InventoryBatch(Guid.NewGuid(), clinicId, itemId, "LOT-SOON", new DateOnly(2026, 12, 1), 3, 1000m, clock.UtcNow);
        var laterBatch = new InventoryBatch(Guid.NewGuid(), clinicId, itemId, "LOT-LATE", new DateOnly(2027, 6, 1), 10, 1000m, clock.UtcNow);

        var batchRepo = new InMemoryBatchRepository([expiredBatch, laterBatch, soonerBatch]);
        var txRepo = new InMemoryTransactionRepository();
        var handler = new ConsumeStockFefoHandler(batchRepo, txRepo, new SerializedTransactionRunner(), clock);

        var result = await handler.Handle(
            new ConsumeStockFefoCommand(clinicId, itemId, 5, InventoryTransactionType.ProcedureExport, "PX-01", "Test FEFO"),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Count);
        Assert.Equal("LOT-SOON", result.Value[0].BatchNumber);
        Assert.Equal(3, result.Value[0].ConsumedQuantity);
        Assert.Equal(0, result.Value[0].RemainingInBatch);

        Assert.Equal("LOT-LATE", result.Value[1].BatchNumber);
        Assert.Equal(2, result.Value[1].ConsumedQuantity);
        Assert.Equal(8, result.Value[1].RemainingInBatch);
        Assert.Equal(10, expiredBatch.QuantityOnHand);
    }

    [Fact]
    public async Task DispensePrescription_ConcurrentRequestsForLastBox_PreventsNegativeStock()
    {
        var clock = new FixedClock(new DateTimeOffset(2026, 11, 27, 9, 0, 0, TimeSpan.Zero));
        var clinicId = Guid.NewGuid();
        var itemId = Guid.NewGuid();

        var lastBoxBatch = new InventoryBatch(Guid.NewGuid(), clinicId, itemId, "LOT-LAST-1", new DateOnly(2027, 5, 1), 1, 50000m, clock.UtcNow);
        var batchRepo = new InMemoryBatchRepository([lastBoxBatch]);
        var txRepo = new InMemoryTransactionRepository();

        var rx1 = Prescription.Create(
            clinicId, "DON-01", Guid.NewGuid(), "Bệnh nhân A", "BN01", Guid.NewGuid(), "BS 1", "Viêm tủy", null, false,
            [new PrescriptionItem(itemId, "Amoxicillin 500mg", "Sáng 1 Tối 1", 1, "Hộp", "Sau ăn")],
            clock.UtcNow).Value!;

        var rx2 = Prescription.Create(
            clinicId, "DON-02", Guid.NewGuid(), "Bệnh nhân B", "BN02", Guid.NewGuid(), "BS 2", "Nhổ răng", null, false,
            [new PrescriptionItem(itemId, "Amoxicillin 500mg", "Sáng 1 Tối 1", 1, "Hộp", "Sau ăn")],
            clock.UtcNow).Value!;

        var rxRepo = new InMemoryPrescriptionRepository([rx1, rx2]);
        var runner = new SerializedTransactionRunner();
        var handler = new DispensePrescriptionHandler(rxRepo, batchRepo, txRepo, runner, clock);

        var t1 = handler.Handle(new DispensePrescriptionCommand(rx1.Id, clinicId), CancellationToken.None);
        var t2 = handler.Handle(new DispensePrescriptionCommand(rx2.Id, clinicId), CancellationToken.None);
        var results = await Task.WhenAll(t1, t2);

        Assert.Equal(1, results.Count(r => r.IsSuccess));
        Assert.Equal(1, results.Count(r => r.IsFailure && r.Error?.Code == "inventory.insufficient_stock"));
        Assert.Equal(0, lastBoxBatch.QuantityOnHand);
        Assert.Single(txRepo.Transactions);
    }

    [Fact]
    public async Task AuditBatchStock_AdjustsQuantityAndRecordsAdjustmentTransaction()
    {
        var clock = new FixedClock(new DateTimeOffset(2026, 11, 27, 10, 0, 0, TimeSpan.Zero));
        var clinicId = Guid.NewGuid();
        var batch = new InventoryBatch(Guid.NewGuid(), clinicId, Guid.NewGuid(), "LOT-AUD", new DateOnly(2027, 8, 1), 20, 15000m, clock.UtcNow);
        var batchRepo = new InMemoryBatchRepository([batch]);
        var txRepo = new InMemoryTransactionRepository();
        var handler = new AuditBatchStockHandler(batchRepo, txRepo, new SerializedTransactionRunner(), clock);

        var result = await handler.Handle(
            new AuditBatchStockCommand(clinicId, batch.Id, 17, "Hao hụt kiểm kê cuối tháng"),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(20, result.Value!.PreviousQuantity);
        Assert.Equal(17, result.Value.ActualQuantity);
        Assert.Equal(-3, result.Value.Delta);
        Assert.Equal(17, batch.QuantityOnHand);
        Assert.Single(txRepo.Transactions);
        Assert.Equal(InventoryTransactionType.Adjustment, txRepo.Transactions[0].Type);
        Assert.Equal(3, txRepo.Transactions[0].Quantity);
    }

    private sealed class FixedClock(DateTimeOffset now) : IClock
    {
        public DateTimeOffset UtcNow => now;
    }

    private sealed class SerializedTransactionRunner : ITransactionRunner
    {
        private readonly SemaphoreSlim _gate = new(1, 1);

        public async Task ExecuteAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken)
        {
            await _gate.WaitAsync(cancellationToken);
            try
            {
                await action(cancellationToken);
            }
            finally
            {
                _gate.Release();
            }
        }

        public async Task<T> ExecuteAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken cancellationToken)
        {
            await _gate.WaitAsync(cancellationToken);
            try
            {
                return await action(cancellationToken);
            }
            finally
            {
                _gate.Release();
            }
        }
    }

    private sealed class InMemoryBatchRepository(List<InventoryBatch> batches) : IInventoryBatchRepository
    {
        public Task<InventoryBatch?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult(batches.FirstOrDefault(b => b.Id == id));

        public Task<IReadOnlyList<InventoryBatch>> ListByItemAsync(Guid clinicId, Guid inventoryItemId, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<InventoryBatch>>(batches.Where(b => b.ClinicId == clinicId && b.InventoryItemId == inventoryItemId).OrderBy(b => b.ExpirationDate).ToList());

        public Task<IReadOnlyList<InventoryBatch>> ListByClinicAsync(Guid clinicId, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<InventoryBatch>>(batches.Where(b => b.ClinicId == clinicId).ToList());

        public Task<IReadOnlyList<InventoryBatch>> ListAvailableFefoAsync(Guid clinicId, Guid inventoryItemId, DateOnly today, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<InventoryBatch>>(
                batches.Where(b => b.ClinicId == clinicId && b.InventoryItemId == inventoryItemId && b.QuantityOnHand > 0 && b.ExpirationDate >= today)
                    .OrderBy(b => b.ExpirationDate)
                    .ToList());

        public Task AddAsync(InventoryBatch batch, CancellationToken cancellationToken)
        {
            batches.Add(batch);
            return Task.CompletedTask;
        }

        public Task ReplaceAsync(InventoryBatch batch, CancellationToken cancellationToken) =>
            Task.CompletedTask;
    }

    private sealed class InMemoryTransactionRepository : IInventoryTransactionRepository
    {
        public List<InventoryTransaction> Transactions { get; } = [];

        public Task<IReadOnlyList<InventoryTransaction>> ListByClinicAsync(Guid clinicId, Guid? inventoryItemId, InventoryTransactionType? type, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<InventoryTransaction>>(Transactions);

        public Task AddAsync(InventoryTransaction transaction, CancellationToken cancellationToken)
        {
            Transactions.Add(transaction);
            return Task.CompletedTask;
        }
    }

    private sealed class InMemoryPrescriptionRepository(List<Prescription> prescriptions) : IPrescriptionRepository
    {
        public Task<Prescription?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult(prescriptions.FirstOrDefault(p => p.Id == id));

        public Task<IReadOnlyList<Prescription>> ListByClinicAsync(Guid clinicId, Guid? patientId, PrescriptionStatus? status, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<Prescription>>(prescriptions);

        public Task AddAsync(Prescription prescription, CancellationToken cancellationToken)
        {
            prescriptions.Add(prescription);
            return Task.CompletedTask;
        }

        public Task ReplaceAsync(Prescription prescription, CancellationToken cancellationToken) =>
            Task.CompletedTask;
    }
}
