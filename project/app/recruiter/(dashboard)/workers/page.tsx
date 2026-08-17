'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Eye, 
  Download, 
  Clock, 
  DollarSign, 
  GraduationCap, 
  User,
  ChevronDown
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/empty-state';
import { getInitials } from '@/lib/format';
import { workerApi, WorkerWithMeta } from '@/lib/scn-api';
import { cn } from '@/lib/utils';

export default function RecruiterWorkerSearchPage() {
  const [search, setSearch] = useState('');
  const [expFilter, setExpFilter] = useState('all');
  const [availFilter, setAvailFilter] = useState('all');
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithMeta | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const workersQuery = useQuery({
    queryKey: ['workers', search],
    queryFn: () => workerApi.search({ q: search || undefined }),
  });
  const workers = useMemo<WorkerWithMeta[]>(() => workersQuery.data ?? [], [workersQuery.data]);

  // Clientside filtering on experience and availability
  const filteredWorkers = useMemo(() => {
    let result = workers;

    // Filter by search term
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) => 
          w.fullName.toLowerCase().includes(q) || 
          (w.headline && w.headline.toLowerCase().includes(q)) ||
          w.skills.some((skill) => skill.toLowerCase().includes(q)) ||
          (w.city && w.city.toLowerCase().includes(q))
      );
    }

    // Filter by Experience dropdown
    if (expFilter !== 'all') {
      result = result.filter((w) => {
        if (expFilter === 'fresher') return w.experienceYears === 0;
        if (expFilter === '1-3') return w.experienceYears >= 1 && w.experienceYears <= 3;
        if (expFilter === '3-5') return w.experienceYears > 3 && w.experienceYears <= 5;
        if (expFilter === '5+') return w.experienceYears > 5;
        return true;
      });
    }

    // Filter by Availability dropdown
    if (availFilter !== 'all') {
      result = result.filter((w) => w.availability === availFilter);
    }

    return result;
  }, [search, expFilter, availFilter, workers]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Container */}
      <div className="flex flex-row items-center justify-between flex-wrap gap-4 border-b border-slate-50 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Worker Search</h1>
          <p className="text-slate-400 text-sm font-semibold mt-1">Find workers that match your assigned industries</p>
        </div>
        <Badge variant="outline" className="bg-slate-100/80 text-slate-500 text-[10px] font-extrabold px-3 py-1.5 rounded-full border-none shadow-sm">
          {filteredWorkers.length.toLocaleString()} FOUND
        </Badge>
      </div>

      {/* Filter row container (aligned side-by-side) */}
      <div className="flex flex-row items-center justify-between flex-wrap gap-4 bg-white border border-slate-100/80 p-4 rounded-2xl shadow-sm">
        {/* Left Search input */}
        <div className="relative w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidates, skills, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#f4f5f7] border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all shadow-inner"
          />
        </div>

        {/* Right dropdowns */}
        <div className="flex items-center gap-3">
          {/* Experience filter */}
          <div className="relative w-full sm:w-auto">
            <select
              value={expFilter}
              onChange={(e) => setExpFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-slate-600 shadow-sm focus:outline-none focus:border-slate-300 w-full sm:w-auto"
            >
              <option value="all">All Experience</option>
              <option value="fresher">Fresher (0 yrs)</option>
              <option value="1-3">1 - 3 Years</option>
              <option value="3-5">3 - 5 Years</option>
              <option value="5+">5+ Years</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Availability filter */}
          <div className="relative w-full sm:w-auto">
            <select
              value={availFilter}
              onChange={(e) => setAvailFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-slate-600 shadow-sm focus:outline-none focus:border-slate-300 w-full sm:w-auto"
            >
              <option value="all">All Availability</option>
              <option value="immediate">Immediate</option>
              <option value="15-days">15 Days</option>
              <option value="30-days">30 Days</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid List of Candidate Cards */}
      {filteredWorkers.length === 0 ? (
        <EmptyState icon={Search} title="No candidates found" description="Try adjusting your filters or complete worker profiles first." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredWorkers.map((worker) => (
            <Card key={worker.id} className="p-6 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/60 transition-all flex flex-col justify-between bg-white text-left">
              <div>
                {/* Profile header */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 border border-slate-100 shadow-sm">
                    <AvatarImage src={worker.avatarUrl} alt={worker.fullName} />
                    <AvatarFallback className="text-sm bg-indigo-50 text-indigo-600 font-extrabold">
                      {getInitials(worker.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-slate-800 text-sm truncate leading-tight">{worker.fullName}</h3>
                    <p className="text-[11px] text-slate-400 font-semibold truncate mt-1">{worker.headline || 'Worker Profile'}</p>
                  </div>
                </div>

                {/* Metrics list */}
                <div className="mt-5 space-y-2.5 text-xs text-slate-500 font-semibold border-t border-slate-50 pt-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{worker.experienceYears} Years Experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{worker.city || worker.preferredLocations[0] || 'Location not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="capitalize">Availability: {worker.availability.replace('-', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 flex items-center justify-center text-[10px] font-bold bg-slate-100 rounded text-slate-500 shrink-0">₹</span>
                    <span>Expected Salary: ₹{(worker.expectedSalaryMin / 100000).toFixed(0)}L - ₹{(worker.expectedSalaryMax / 100000).toFixed(0)}L</span>
                  </div>
                </div>

                {/* Skills badges */}
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {worker.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 border-none font-bold text-[9px] px-2 py-0.5 rounded">
                      {skill}
                    </Badge>
                  ))}
                  {worker.skills.length > 3 && (
                    <Badge variant="outline" className="text-[9px] font-extrabold px-2 py-0.5 rounded border-slate-100 text-slate-400">
                      +{worker.skills.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-2 pt-4 border-t border-slate-50">
                <Button 
                  onClick={() => { setSelectedWorker(worker); setIsDetailsOpen(true); }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-2 text-xs shadow-sm h-auto flex items-center justify-center gap-1.5"
                >
                  <Eye className="h-4 w-4" />
                  View Profile
                </Button>
                {worker.resumeUrl && (
                  <Button variant="outline" size="icon" className="border-slate-200 hover:bg-slate-50 text-slate-400 rounded-xl h-9 w-9 shrink-0 shadow-sm" asChild>
                    <a href={worker.resumeUrl} target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Details Sheet */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent side="right" className="h-full overflow-y-auto bg-white border-l border-slate-100 shadow-xl p-6 sm:max-w-xl w-3/4 md:w-[500px]">
          <SheetHeader className="text-left border-b border-slate-50 pb-4 mb-4">
            <SheetTitle className="text-lg font-bold text-slate-800">Worker Profile Details</SheetTitle>
          </SheetHeader>
          
          {selectedWorker && (
            <div className="space-y-6 mt-4">
              {/* Profile Overview */}
              <div className="flex items-center gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-xl text-left">
                <Avatar className="h-16 w-16 border border-indigo-100">
                  <AvatarImage src={selectedWorker.avatarUrl} alt={selectedWorker.fullName} />
                  <AvatarFallback className="text-lg font-bold bg-indigo-50 text-indigo-600">
                    {getInitials(selectedWorker.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-base font-extrabold text-slate-800 leading-tight">{selectedWorker.fullName}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">{selectedWorker.headline || 'Worker Profile'}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    {selectedWorker.city || 'Location not specified'} • {selectedWorker.experienceYears} Years Exp
                  </p>
                </div>
                {selectedWorker.resumeUrl && (
                  <Button size="sm" variant="outline" className="border-slate-200 font-bold rounded-lg" asChild>
                    <a href={selectedWorker.resumeUrl} target="_blank" rel="noreferrer">
                      <Download className="mr-1.5 h-4 w-4" /> Resume
                    </a>
                  </Button>
                )}
              </div>

              {/* Bio / Summary */}
              {selectedWorker.bio && (
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Professional Summary</span>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed bg-slate-50/20 p-3 rounded-lg border border-slate-100">{selectedWorker.bio}</p>
                </div>
              )}

              {/* Grid Specifications */}
              <div className="grid grid-cols-2 gap-4 text-left border-t border-b border-slate-100 py-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Experience</span>
                  <p className="font-extrabold text-slate-700 text-sm mt-0.5">{selectedWorker.experienceYears} Years</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Salary Bracket</span>
                  <p className="font-extrabold text-slate-700 text-sm mt-0.5">₹{(selectedWorker.expectedSalaryMin / 100000).toFixed(0)}L - ₹{(selectedWorker.expectedSalaryMax / 100000).toFixed(0)}L</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Availability</span>
                  <p className="font-extrabold text-slate-700 text-sm mt-0.5 capitalize">{selectedWorker.availability.replace('-', ' ')}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</span>
                  <p className="font-extrabold text-slate-700 text-sm mt-0.5">{selectedWorker.city || selectedWorker.preferredLocations[0] || 'N/A'}</p>
                </div>
              </div>

              {/* Skills */}
              <div className="text-left">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Technical Skills</span>
                <div className="flex flex-wrap gap-2">
                  {selectedWorker.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-none font-bold text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Preferred Locations */}
              {selectedWorker.preferredLocations.length > 0 && (
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Preferred Cities</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorker.preferredLocations.map((loc, idx) => (
                      <Badge key={idx} variant="outline" className="border-slate-100 text-slate-500 font-semibold text-xs">
                        {loc}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
