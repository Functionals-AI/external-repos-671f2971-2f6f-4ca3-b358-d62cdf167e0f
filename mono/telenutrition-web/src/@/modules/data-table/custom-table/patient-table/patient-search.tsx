import { Combobox } from '@headlessui/react';
import { SearchIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PatientTableRow } from './';

interface PatientSearchProps {
  setFilteredTableRows: (filteredTableRows: PatientTableRow[]) => void;
  tableRows: PatientTableRow[];
}

export default function PatientSearch({ setFilteredTableRows, tableRows }: PatientSearchProps) {
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    const filterRow = (row: PatientTableRow, searchQuery: string): boolean => {
      const members = row.type === 'single' ? [row.data] : row.subRows.map((r) => r.data);

      return members.some((member) => {
        const fullName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.toLowerCase();
        const firstName = (member.firstName ?? '').toLowerCase();
        const lastName = (member.lastName ?? '').toLowerCase();
        const birthday = member?.birthday ?? '';

        if (!birthday) return false;
        const [year, month, day] = birthday.split('-');
        const dateYYMMDD = `${day}-${month}-${year}`;
        const dateDDMMYY = `${year}-${month}-${day}`;
        const queryLower = searchQuery.toLowerCase().replace(/\s+/g, '');

        return (
          fullName?.includes(queryLower) ||
          firstName.includes(queryLower) ||
          lastName.includes(queryLower) ||
          dateYYMMDD?.includes(queryLower) ||
          dateDDMMYY?.includes(queryLower)
        );
      });
    };

    const filtered = query ? tableRows.filter((row) => filterRow(row, query)) : tableRows;

    setFilteredTableRows(filtered);
  }, [query]);

  return (
    <>
      <Combobox
        value={query}
        onChange={(value) => {
          setQuery(value ?? '');
        }}
      >
        <div className="relative mt-4 mb-6">
          <div className="relative inline-block cursor-default overflow-hidden">
            <SearchIcon
              className="absolute inset-y-0 left-0 h-6 w-6 text-gray-400 ml-2 mt-2"
              aria-hidden="true"
            />
            <Combobox.Input
              data-testid="patient-search-input"
              placeholder="Search"
              className={`pl-9 h-10 text-base py-2 px-2 !mt-0 border border-solid border-neutral-150 rounded-md outline-none focus:ring-0`}
              style={{ width: '302px' }}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query.length > 0 && (
              <Combobox.Button
                aria-label="dropdown all providers"
                className="absolute inset-y-0 right-0 flex items-center pr-2"
                type="button"
                onClick={() => setQuery('')}
              >
                <X className="h-5 w-5 text-gray-500" aria-hidden="true" />
              </Combobox.Button>
            )}
          </div>
        </div>
      </Combobox>
    </>
  );
}
