import { getAiUsageData } from "./actions";

export default async function AiUsagePage() {
  const { credits, aiUsages } = await getAiUsageData();

   const totalCost = aiUsages.reduce((sum, u) => sum + u.costUsd, 0); 
  const totalGenerations = aiUsages.filter((u) => u.success).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">AI Usage</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your AI slide generation credits and history.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Remaining Credits</p>
          <p className="text-3xl font-bold mt-1">{credits}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Generations</p>
          <p className="text-3xl font-bold mt-1">{totalGenerations}</p>
        </div>
         
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total API Cost</p>
          <p className="text-3xl font-bold mt-1">${totalCost.toFixed(4)}</p>
        </div>
        
      </div>

      <div>
        <h2 className="text-base font-semibold mb-4">Generation History</h2>
        {aiUsages.length === 0 ? (
          <p className="text-muted-foreground text-sm">No generations yet.</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-y-auto max-h-100">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Prompt</th>
                  <th className="text-left p-3 font-medium">In</th>
                  <th className="text-left p-3 font-medium">Out</th>
                 <th className="text-left p-3 font-medium">Cost</th>
                  <th className="text-left p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {aiUsages.map((usage) => (
                  <tr key={usage.id} className="border-t">
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {new Date(usage.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 max-w-[200px] truncate">{usage.prompt}</td>
                    <td className="p-3">{usage.inputTokens.toLocaleString()}</td>
                    <td className="p-3">{usage.outputTokens.toLocaleString()}</td>
                    <td className="p-3">${usage.costUsd.toFixed(4)}</td>
                    <td className="p-3">
                      {usage.success ? (
                        <span className="text-green-600 font-medium">Success</span>
                      ) : (
                        <span className="text-destructive font-medium">Failed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
