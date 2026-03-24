import { Skeleton } from "@shopvendly/ui/components/skeleton";
import { Card, CardContent } from "@shopvendly/ui/components/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shopvendly/ui/components/table";

export default function Loading() {
    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            {/* Header Skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-[150px]" />
                <Skeleton className="h-4 w-[250px]" />
            </div>

            {/* Stats Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i} size="sm" className="bg-muted/20 border-border/40 shadow-none">
                        <CardContent className="pt-4 flex flex-col gap-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-7 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Table Skeleton */}
            <div className="rounded-md border border-border/70 bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                            <TableHead><Skeleton className="h-3 w-24" /></TableHead>
                            <TableHead><Skeleton className="h-3 w-16" /></TableHead>
                            <TableHead><Skeleton className="h-3 w-20" /></TableHead>
                            <TableHead><Skeleton className="h-3 w-24" /></TableHead>
                            <TableHead><Skeleton className="h-3 w-32" /></TableHead>
                            <TableHead><Skeleton className="h-3 w-20" /></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
