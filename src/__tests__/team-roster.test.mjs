import { test } from 'node:test';
import assert from 'node:assert/strict';
import { partitionTeamRoster, splitTeamMembers } from '../lib/teamRoster.mjs';

test('orders active members by year and separates alumni', () => {
  const members = [
    { id: 'fourth', fullName: 'Fourth', yearOfStudy: 4 },
    { id: 'alumni', fullName: 'Alumni', yearOfStudy: 5 },
    { id: 'first', fullName: 'First', yearOfStudy: 1 },
    { id: 'second', fullName: 'Second', yearOfStudy: 2 },
    { id: 'third', fullName: 'Third', yearOfStudy: 3 },
    { id: 'unknown', fullName: 'Unknown' },
    { id: 'private-alumni', fullName: 'Private Alumni', isAlumni: true },
  ];

  const result = splitTeamMembers(members);
  assert.deepEqual(result.active.map((member) => member.id), ['first', 'second', 'third', 'fourth', 'unknown']);
  assert.deepEqual(result.alumni.map((member) => member.id), ['alumni', 'private-alumni']);
});

test('keeps Alumni leaders out of active leadership and deduplicates the Alumni section', () => {
  const member = { id: 'leader', fullName: 'Leader', yearOfStudy: 5, isAlumni: true };
  const result = partitionTeamRoster([member], [member]);
  assert.deepEqual(result.leadership, []);
  assert.deepEqual(result.activeMembers, []);
  assert.deepEqual(result.alumni.map((person) => person.id), ['leader']);
});