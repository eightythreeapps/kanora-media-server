import React from 'react';

export const Dashboard: React.FC = () => {
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="w-full max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Dashboard</h1>
        {/* Library Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg bg-card p-6 shadow-sm border">
            <div className="text-sm text-muted-foreground">Total Albums</div>
            <div className="text-2xl font-bold mt-2">--</div>
          </div>
          <div className="rounded-lg bg-card p-6 shadow-sm border">
            <div className="text-sm text-muted-foreground">Total Tracks</div>
            <div className="text-2xl font-bold mt-2">--</div>
          </div>
          <div className="rounded-lg bg-card p-6 shadow-sm border">
            <div className="text-sm text-muted-foreground">Total Artists</div>
            <div className="text-2xl font-bold mt-2">--</div>
          </div>
        </div>

        {/* Last Imported Albums */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Last Imported Albums</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* TODO: Map over last imported albums */}
            <div className="rounded-lg bg-muted p-4 h-32 flex items-center justify-center text-muted-foreground">
              No data
            </div>
            <div className="rounded-lg bg-muted p-4 h-32 flex items-center justify-center text-muted-foreground">
              No data
            </div>
            <div className="rounded-lg bg-muted p-4 h-32 flex items-center justify-center text-muted-foreground">
              No data
            </div>
            <div className="rounded-lg bg-muted p-4 h-32 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          </div>
        </div>

        {/* Recently Played Tracks */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Recently Played Tracks</h2>
          <div className="rounded-lg bg-card p-4 border">
            {/* TODO: Map over recently played tracks */}
            <div className="text-muted-foreground">No data</div>
          </div>
        </div>
      </div>
    </div>
  );
};
