mkdir -p .bundle/themes/admin/

cd .bundle
cp -a ../controllers/ controllers
cp -a ../definitions/ definitions
cp -a ../schemas/ schemas
cp -a ../modules/ modules
cp -a ../themes/admin/* themes/admin
cp -a ../public/ public
cp -a ../resources/ resources
mv controllers/api.js controllers/cms-api.js
rm controllers/default.js

echo "ZXhwb3J0cy5pbnN0YWxsID0gZnVuY3Rpb24oKSB7CglST1VURSgnLyonLCBmdW5jdGlvbigpIHsKCQl0aGlzLkNNU3BhZ2UoKTsKCX0pOwp9Owo=" | base64 --decode > controllers/cms-default.js

# cd definitions
# for f in *.js; do mv "$f" "`echo cms-$f`"; done

# cd ../schemas
# for f in *.js; do mv "$f" "`echo cms-$f`"; done

# cd ..
tpm create cms.package
cp cms.package ../cms.bundle

cd ..
rm -rf .bundle
echo "DONE"