'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Modal, Alert } from '@/components/UIComponents';
import { rewardsApi } from '@/lib/api';

export default function ShopPage() {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [shopItems, setShopItems] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    loadShopData();
  }, [user]);

  const loadShopData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const [pointsData, itemsData, redemptionsData] = await Promise.all([
        rewardsApi.getTenantPoints(),
        rewardsApi.getShopItems(),
        rewardsApi.getRedemptions(),
      ]);

      setPoints((pointsData as any).points || 0);
      setShopItems(itemsData as any[]);
      setRedemptions(redemptionsData as any[]);
    } catch (error) {
      console.error('Error loading shop data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeemClick = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedItem || !user) return;
    
    setIsRedeeming(true);
    setAlert(null);
    
    try {
      await rewardsApi.redeemItem(selectedItem.id);
      setAlert({
        type: 'success',
        message: `Successfully redeemed ${selectedItem.name}!`,
      });
      setIsModalOpen(false);
      loadShopData(); // Reload to update points and redemptions
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to redeem item. Please try again.',
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  if (isLoading) {
    return <div className="text-card-text/70">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-card-text">Rewards Marketplace</h1>
        <p className="text-card-text/70 mt-1">Redeem your points for amazing rewards!</p>
      </div>

      {/* Alert */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Points Balance */}
      <div className="bg-gradient-to-r from-primary to-primary-light rounded-lg p-6 text-white border border-primary-light/20">
        <p className="text-sm opacity-90">Your Points Balance</p>
        <p className="text-5xl font-bold mt-2">{points}</p>
        <p className="text-sm opacity-90 mt-2">
          Earn +50 points for on-time payments • Lose -20 points for late payments
        </p>
      </div>

      {/* Shop Items */}
      <div className="bg-card-bg rounded-lg border border-border p-6">
        <h2 className="text-xl font-bold text-card-text mb-4">Available Rewards</h2>
        {shopItems.length === 0 ? (
          <p className="text-card-text/70">No items available at the moment</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shopItems.map((item) => {
              const canAfford = points >= item.pointCost;
              
              return (
                <div
                  key={item.id}
                  className={`border-2 rounded-lg p-4 transition-all bg-white/5 ${
                    canAfford
                      ? 'border-primary/30 hover:border-primary hover:shadow-lg hover:shadow-primary/20'
                      : 'border-border opacity-60'
                  }`}
                >
                  {item.imageUrl && (
                    <div className="w-full h-32 bg-white/10 rounded-lg mb-3 flex items-center justify-center text-4xl">
                      {item.imageUrl}
                    </div>
                  )}
                  {!item.imageUrl && (
                    <div className="w-full h-32 bg-gradient-to-br from-primary to-primary-light rounded-lg mb-3 flex items-center justify-center text-white text-5xl">
                      🎁
                    </div>
                  )}
                  
                  <h3 className="font-bold text-card-text text-lg">{item.name}</h3>
                  <p className="text-sm text-card-text/70 mt-1 mb-3">{item.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      {item.pointCost} pts
                    </span>
                    <Button
                      onClick={() => handleRedeemClick(item)}
                      disabled={!canAfford}
                      variant="primary"
                    >
                      {canAfford ? 'Redeem' : 'Not Enough'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Redemption History */}
      <div className="bg-card-bg rounded-lg border border-border p-6">
        <h2 className="text-xl font-bold text-card-text mb-4">Your Redemptions</h2>
        {redemptions.length === 0 ? (
          <p className="text-card-text/70">No redemptions yet</p>
        ) : (
          <div className="space-y-3">
            {redemptions.map((redemption) => (
              <div
                key={redemption.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg bg-white/5"
              >
                <div>
                  <p className="font-medium text-card-text">{redemption.itemName}</p>
                  <p className="text-sm text-card-text/70">
                    {new Date(redemption.date).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-lg font-bold text-primary">
                  -{redemption.pointsSpent} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isRedeeming) {
            setIsModalOpen(false);
            setSelectedItem(null);
          }
        }}
        title="Confirm Redemption"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-xl font-bold text-card-text">{selectedItem.name}</h3>
              <p className="text-card-text/70 mt-2">{selectedItem.description}</p>
            </div>

            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
              <p className="text-sm text-card-text/70">Cost</p>
              <p className="text-3xl font-bold text-primary">{selectedItem.pointCost} points</p>
              <p className="text-sm text-card-text/70 mt-2">
                You will have <strong className="text-card-text">{points - selectedItem.pointCost}</strong> points remaining
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleConfirmRedeem}
                variant="primary"
                fullWidth
                disabled={isRedeeming}
              >
                {isRedeeming ? 'Redeeming...' : 'Confirm Redemption'}
              </Button>
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedItem(null);
                }}
                variant="secondary"
                fullWidth
                disabled={isRedeeming}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
